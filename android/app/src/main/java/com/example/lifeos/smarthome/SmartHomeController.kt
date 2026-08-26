package com.example.lifeos.smarthome

interface SmartHomeController {

    suspend fun getDevices(): List<SmartDevice>

    suspend fun turnOn(deviceId: String)

    suspend fun turnOff(deviceId: String)

    suspend fun setBrightness(deviceId: String, brightness: Int)

    suspend fun setColor(deviceId: String, color: String)
}
