package com.example.lifeos.smarthome

import android.util.Log

class MockSmartHomeController : SmartHomeController {

    private val devices = mutableListOf(
        SmartDevice("qubo_plug_1", "Qubo Smart Plug", SmartDeviceType.PLUG, isOnline = true, isOn = false),
        SmartDevice("qubo_light_1", "Qubo Smart Bulb", SmartDeviceType.LIGHT, isOnline = true, isOn = false)
    )

    override suspend fun getDevices(): List<SmartDevice> {
        return devices.toList()
    }

    override suspend fun turnOn(deviceId: String) {
        val index = devices.indexOfFirst { it.id == deviceId }
        if (index >= 0) {
            devices[index] = devices[index].copy(isOn = true)
            Log.d("JARVIS", "SmartHome Mock: Turned ON device $deviceId")
        }
    }

    override suspend fun turnOff(deviceId: String) {
        val index = devices.indexOfFirst { it.id == deviceId }
        if (index >= 0) {
            devices[index] = devices[index].copy(isOn = false)
            Log.d("JARVIS", "SmartHome Mock: Turned OFF device $deviceId")
        }
    }

    override suspend fun setBrightness(deviceId: String, brightness: Int) {
        Log.d("JARVIS", "SmartHome Mock: Set device $deviceId brightness to $brightness%")
    }

    override suspend fun setColor(deviceId: String, color: String) {
        Log.d("JARVIS", "SmartHome Mock: Set device $deviceId color to $color")
    }
}
