package com.example.lifeos.jarvis.audio

import android.content.Context
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.AudioRecord
import android.os.Build
import android.os.Handler
import android.os.Looper
import com.example.lifeos.jarvis.logging.JarvisLog

/**
 * Centralized audio routing component for LifeOS and JARVIS.
 *
 * Enforces:
 * - INPUT: Built-in Microphone (AudioDeviceInfo.TYPE_BUILTIN_MIC) ONLY
 * - OUTPUT: Bluetooth Speaker / System default is preserved
 * - Rejects all Bluetooth microphone inputs (SCO, BLE, etc.)
 * - Monitors dynamic route changes and maintains built-in mic binding.
 */
class JarvisAudioRouter(
    private val context: Context
) {
    private val audioManager = context.applicationContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val mainHandler = Handler(Looper.getMainLooper())
    private var deviceCallback: AudioDeviceCallback? = null

    /**
     * Finds the device's built-in microphone.
     * Explicitly ignores all Bluetooth input devices.
     */
    fun findBuiltInMicrophone(): AudioDeviceInfo? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return null

        val inputDevices = audioManager.getDevices(AudioManager.GET_DEVICES_INPUTS)
        logDiscoveredDevices(inputDevices)

        // Find TYPE_BUILTIN_MIC
        val builtInMic = inputDevices.firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_MIC }

        if (builtInMic == null) {
            JarvisLog.e("JARVIS_AUDIO_ERROR", "Built-in microphone not found among available input devices.")
        }
        return builtInMic
    }

    /**
     * Configures the given [AudioRecord] to use the built-in microphone as preferred device.
     * Returns true if successfully requested.
     */
    fun configureAudioRecord(record: AudioRecord, stage: String): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true

        val builtInMic = findBuiltInMicrophone()
        if (builtInMic == null) {
            JarvisLog.e("JARVIS_AUDIO_ROUTE_MISMATCH", "stage=$stage requested=TYPE_BUILTIN_MIC actual=NONE")
            return false
        }

        // Force set preferred device to built-in mic, rejecting all Bluetooth inputs
        val success = record.setPreferredDevice(builtInMic)
        
        // Additional enforcement: explicitly disable Bluetooth SCO if active
        try {
            audioManager.isBluetoothScoOn = false
            audioManager.stopBluetoothSco()
        } catch (e: Exception) {
            // Ignore if SCO operations fail
        }
        
        JarvisLog.d(
            "JARVIS_AUDIO_PREFERRED_INPUT_REQUESTED",
            "stage=$stage deviceType=TYPE_BUILTIN_MIC deviceName=${builtInMic.productName} success=$success bluetoothScoDisabled=true"
        )
        return success
    }

    /**
     * Verifies the actual routed device on an active [AudioRecord].
     */
    fun verifyInputRoute(record: AudioRecord, stage: String): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true

        val routed = record.routedDevice
        if (routed == null) {
            JarvisLog.w("JARVIS_AUDIO_ROUTE_PENDING", "stage=$stage routed device not yet assigned by OS")
            return true
        }

        val isBuiltIn = routed.type == AudioDeviceInfo.TYPE_BUILTIN_MIC
        val isBluetooth = isBluetoothInput(routed.type)
        val typeName = getDeviceTypeName(routed.type)

        if (isBuiltIn) {
            JarvisLog.d(
                "JARVIS_AUDIO_ROUTE_VERIFIED",
                "stage=$stage requested=TYPE_BUILTIN_MIC actual=$typeName actualName=${routed.productName} isBuiltInMic=true isBluetooth=false"
            )
        } else {
            JarvisLog.e(
                "JARVIS_AUDIO_ROUTE_MISMATCH",
                "stage=$stage requested=TYPE_BUILTIN_MIC actual=$typeName actualName=${routed.productName} isBuiltInMic=false isBluetooth=$isBluetooth FORCE_REDIRECTING"
            )
            
            // Force redirect to built-in mic if wrong device is routed
            if (!isBuiltIn) {
                val builtInMic = findBuiltInMicrophone()
                if (builtInMic != null) {
                    record.setPreferredDevice(builtInMic)
                    JarvisLog.d("JARVIS_AUDIO_FORCE_REDIRECT", "stage=$stage forced redirect to TYPE_BUILTIN_MIC")
                }
            }
        }
        return isBuiltIn
    }

    /**
     * Attaches dynamic routing listeners to re-enforce built-in mic if Android tries to switch to Bluetooth.
     */
    fun attachRoutingListener(record: AudioRecord, stage: String, onRouteMismatch: (() -> Unit)? = null) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            record.addOnRoutingChangedListener(
                AudioRecord.OnRoutingChangedListener { rec ->
                    val isValid = verifyInputRoute(rec as AudioRecord, stage)
                    if (!isValid) {
                        // Force disable Bluetooth SCO and re-apply built-in mic
                        try {
                            audioManager.isBluetoothScoOn = false
                            audioManager.stopBluetoothSco()
                        } catch (e: Exception) {
                            // Ignore if SCO operations fail
                        }
                        
                        val builtInMic = findBuiltInMicrophone()
                        if (builtInMic != null) {
                            rec.setPreferredDevice(builtInMic)
                            JarvisLog.d("JARVIS_AUDIO_ROUTE_LISTENER_REDIRECT", "stage=$stage forced redirect to TYPE_BUILTIN_MIC")
                        }
                        onRouteMismatch?.invoke()
                    }
                },
                mainHandler
            )
        }
    }

    /**
     * Registers an [AudioDeviceCallback] to detect Bluetooth connect/disconnect events
     * and ensure built-in microphone stays selected.
     */
    fun startMonitoring(onDeviceChanged: () -> Unit) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return

        val callback = object : AudioDeviceCallback() {
            override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
                logDeviceChange("ADDED", addedDevices)
                onDeviceChanged()
            }

            override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
                logDeviceChange("REMOVED", removedDevices)
                onDeviceChanged()
            }
        }
        audioManager.registerAudioDeviceCallback(callback, mainHandler)
        deviceCallback = callback
    }

    fun stopMonitoring() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && deviceCallback != null) {
            audioManager.unregisterAudioDeviceCallback(deviceCallback)
            deviceCallback = null
        }
    }

    private fun logDiscoveredDevices(devices: Array<AudioDeviceInfo>) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return

        JarvisLog.d("JARVIS_AUDIO_DEVICES", "Discovered ${devices.size} input device(s)")
        for (device in devices) {
            val typeStr = getDeviceTypeName(device.type)
            val isBluetooth = isBluetoothInput(device.type)
            JarvisLog.d(
                "JARVIS_AUDIO_DEVICE",
                "type=$typeStr name=${device.productName} isSource=${device.isSource} isBluetooth=$isBluetooth"
            )
        }
    }

    private fun logDeviceChange(action: String, devices: Array<out AudioDeviceInfo>?) {
        if (devices == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
        for (d in devices) {
            JarvisLog.d(
                "JARVIS_AUDIO_ROUTE_CHANGE",
                "action=$action type=${getDeviceTypeName(d.type)} name=${d.productName} isSource=${d.isSource}"
            )
        }
    }

    companion object {
        fun isBluetoothInput(type: Int): Boolean {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                when (type) {
                    AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
                    AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
                    AudioDeviceInfo.TYPE_BLE_HEADSET,
                    AudioDeviceInfo.TYPE_BLE_SPEAKER -> true
                    else -> false
                }
            } else {
                false
            }
        }

        fun getDeviceTypeName(type: Int): String {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return "TYPE_$type"
            return when (type) {
                AudioDeviceInfo.TYPE_BUILTIN_MIC -> "TYPE_BUILTIN_MIC"
                AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "TYPE_BLUETOOTH_SCO"
                AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "TYPE_BLUETOOTH_A2DP"
                AudioDeviceInfo.TYPE_WIRED_HEADSET -> "TYPE_WIRED_HEADSET"
                AudioDeviceInfo.TYPE_USB_DEVICE -> "TYPE_USB_DEVICE"
                AudioDeviceInfo.TYPE_USB_HEADSET -> "TYPE_USB_HEADSET"
                AudioDeviceInfo.TYPE_BLE_HEADSET -> "TYPE_BLE_HEADSET"
                AudioDeviceInfo.TYPE_BLE_SPEAKER -> "TYPE_BLE_SPEAKER"
                AudioDeviceInfo.TYPE_BUILTIN_EARPIECE -> "TYPE_BUILTIN_EARPIECE"
                AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> "TYPE_BUILTIN_SPEAKER"
                else -> "TYPE_$type"
            }
        }
    }
}
