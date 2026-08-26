package com.example.lifeos.smarthome

enum class SmartDeviceType {
    PLUG,
    LIGHT,
    UNKNOWN
}

data class SmartDevice(
    val id: String,
    val name: String,
    val type: SmartDeviceType,
    val isOnline: Boolean,
    val isOn: Boolean
)
