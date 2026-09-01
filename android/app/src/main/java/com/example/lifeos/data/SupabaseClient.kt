package com.example.lifeos.data

import com.example.lifeos.BuildConfig
import com.example.lifeos.LifeOSApplication
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.realtime.Realtime

object SupabaseProvider {
    private val SUPABASE_URL = BuildConfig.SUPABASE_URL
    private val SUPABASE_KEY = BuildConfig.SUPABASE_KEY

    init {
        android.util.Log.d("Supabase", "Initializing with URL: $SUPABASE_URL")
    }

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Postgrest)
        install(Auth) {
            alwaysAutoRefresh = true
            sessionManager = AndroidSessionManager(LifeOSApplication.instance)
        }
        install(Realtime)
    }
}
