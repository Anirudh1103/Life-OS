package com.example.lifeos.data.models

import kotlinx.serialization.Serializable

@Serializable
data class Profile(
    val id: String,
    val display_name: String? = null,
    val avatar_url: String? = null,
    val created_at: String? = null,
    val updated_at: String? = null
)
