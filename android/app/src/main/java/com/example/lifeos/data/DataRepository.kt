package com.example.lifeos.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

interface DataRepository {
  val data: Flow<List<String>>
  fun getDailyAgenda(): String
}

class DefaultDataRepository : DataRepository {
  override val data: Flow<List<String>> = flow { emit(listOf("Android")) }

  override fun getDailyAgenda(): String {
      return "Sir, for today you have three main tasks: First, review the LifeOS architecture at 10 AM. Second, a fitness session is scheduled for 5 PM. And third, you have a meeting with the development team at 8 PM. Shall I prepare anything else?"
  }
}
