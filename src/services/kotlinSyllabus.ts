export interface SyllabusTopic {
  title: string;
  description: string;
  notes: string;
  sort_order: number;
}

export const KOTLIN_SYLLABUS: SyllabusTopic[] = [
  {
    title: '0.1 Programming basics',
    description: 'Introduction to programs, compilation vs interpretation, and JVM environment baselines.',
    notes: '📋 Topics to Learn:\n• What is a program?\n• Compiler vs interpreter\n• Source code → compilation → executable\n• JVM (Java Virtual Machine)\n• JDK vs JRE\n• Kotlin compiler & Kotlin/JVM\n• Kotlin vs Java\n• Kotlin Android development ecosystem\n\n📖 Study Notes:\nCompilers translate source code to machine code or bytecode in advance, while interpreters execute instructions line-by-line. Kotlin targets the JVM by compiling to Java bytecode (.class files) to run anywhere.',
    sort_order: 1
  },
  {
    title: '0.2 Basic programming concepts',
    description: 'Core building blocks of code logic and application memory structures.',
    notes: '📋 Topics to Learn:\n• Variables & Constants\n• Data, Expressions & Statements\n• Operators & Conditions\n• Loops & Functions\n• Objects & Classes\n• Memory basics (Stack vs Heap)\n\n📖 Study Notes:\nStack memory is used for fast execution thread tracking (local variables). Heap memory handles dynamic object allocations.',
    sort_order: 2
  },
  {
    title: '0.3 Development environment',
    description: 'Workspace configuration and Kotlin directory layouts.',
    notes: '📋 Topics to Learn:\n• IntelliJ IDEA\n• Android Studio\n• Kotlin Playground\n• Gradle build automation system basics\n• Kotlin project structure (src, main, test)\n\n📖 Study Notes:\nGradle handles compiling and dependency resolution. Kotlin projects use src/main/kotlin for code and src/test/kotlin for unit tests.',
    sort_order: 3
  },
  {
    title: '1.1 Hello Kotlin',
    description: 'Writing and executing your first Kotlin entry program.',
    notes: '📋 Topics to Learn:\n• fun declaration\n• main entrypoint\n• println output statement\n• Semicolons and Kotlin syntax\n\n📖 Code Example:\n```kotlin\nfun main() {\n    println("Hello Kotlin")\n}\n```',
    sort_order: 4
  },
  {
    title: '1.2 Variables',
    description: 'Understanding memory storage declarations and mutability bindings.',
    notes: '📋 Topics to Learn:\n• val (read-only bindings)\n• var (mutable bindings)\n• Immutability vs Mutability\n• Type inference vs Explicit type declarations\n\n📖 Code Example:\n```kotlin\nval name = "Anirudh" // Read-only type inferred as String\nvar age: Int = 25    // Mutable type declared explicitly\n```',
    sort_order: 5
  },
  {
    title: '1.3 Kotlin Data Types',
    description: 'Mastering Kotlin\'s standard types and number classifications.',
    notes: '📋 Topics to Learn:\n• Numbers (Byte, Short, Int, Long, Float, Double)\n• Boolean, Char, and String types\n• Ranges & Numeric overflow\n• Literals & Type conversion\n\n📖 Example Question:\nWhy is `x + y` valid if `val x = 10` (Int) and `val y = 20L` (Long)?\nBecause of operator overloading, where the expression is converted and returns a Long.',
    sort_order: 6
  },
  {
    title: '1.4 Type Conversion',
    description: 'Explicit type conversions and type-safe narrow boundaries.',
    notes: '📋 Topics to Learn:\n• Conversion methods: toInt(), toLong(), toDouble(), toFloat(), toString()\n• Why Kotlin does not support implicit type widening (e.g. Int → Long)\n\n📖 Study Notes:\nKotlin requires explicit conversion to prevent silent data loss or widening bugs.',
    sort_order: 7
  },
  {
    title: '1.5 Operators',
    description: 'Arithmetic, comparison, logical, and shorthand assignments.',
    notes: '📋 Topics to Learn:\n• Arithmetic operators (+, -, *, /, %)\n• Comparison operators (>, <, >=, <=, ==, !=)\n• Logical operators (&&, ||, !)\n• Assignment operators (=, +=, -=, *=, /=, %=)\n• Increment & Decrement operators (++, --)',
    sort_order: 8
  },
  {
    title: '2.1 if / else',
    description: 'Branching and using conditionals as value expressions.',
    notes: '📋 Topics to Learn:\n• Basic conditional branching\n• if-else as expression returning values\n\n📖 Code Example:\n```kotlin\nval result = if (age >= 18) {\n    "Adult"\n} else {\n    "Minor"\n}\n```',
    sort_order: 9
  },
  {
    title: '2.2 Nested conditions',
    description: 'Nested evaluations, compound checks, and guard validations.',
    notes: '📋 Topics to Learn:\n• Nested if conditional blocks\n• Logical expression compounding\n• Guard-style validation checks',
    sort_order: 10
  },
  {
    title: '2.3 when',
    description: 'The powerful when pattern matcher.',
    notes: '📋 Topics to Learn:\n• Basic when replacement for switch\n• when as an expression returning values\n• Ranges checking (in 1..10)\n• Type checking (is String)\n• Exhaustive check constraints\n\n📖 Code Example:\n```kotlin\nval res = when (value) {\n    in 1..10 -> "Range"\n    is String -> "Type"\n    else -> "Fallback"\n}\n```',
    sort_order: 11
  },
  {
    title: '2.4 Loops',
    description: 'Iteration structures: loops and bounds.',
    notes: '📋 Topics to Learn:\n• for loops\n• while loops\n• do-while loops\n\n📖 Code Example:\n```kotlin\nfor (i in 1..10) { ... }\n```',
    sort_order: 12
  },
  {
    title: '2.5 Ranges',
    description: 'Interval steps and boundaries.',
    notes: '📋 Topics to Learn:\n• Inclusive range (1..10)\n• Exclusive range (1 until 10)\n• Backward iteration (10 downTo 1)\n• Custom steps (1..10 step 2)',
    sort_order: 13
  },
  {
    title: '2.6 Loop control',
    description: 'Jumping constructs: breaks, continues, and labels.',
    notes: '📋 Topics to Learn:\n• break statement\n• continue statement\n• Labeled break & Labeled continue scope redirects',
    sort_order: 14
  },
  {
    title: '3.1 Basic functions',
    description: 'Creating functions, parameter values, and return bounds.',
    notes: '📋 Topics to Learn:\n• Function parameters\n• Return types & statements\n• The default Unit return type\n\n📖 Code Example:\n```kotlin\nfun add(a: Int, b: Int): Int {\n    return a + b\n}\n```',
    sort_order: 15
  },
  {
    title: '3.2 Single-expression functions',
    description: 'Shorthand functions for direct expressions.',
    notes: '📋 Topics to Learn:\n• Syntax formatting omitting body braces\n• Implicit return type inference\n\n📖 Code Example:\n```kotlin\nfun add(a: Int, b: Int) = a + b\n```',
    sort_order: 16
  },
  {
    title: '3.3 Default arguments',
    description: 'Parameters with pre-set fallback values.',
    notes: '📋 Topics to Learn:\n• Defining parameters with defaults\n• Preventing boilerplate overloads\n\n📖 Code Example:\n```kotlin\nfun greet(name: String = "User")\n```',
    sort_order: 17
  },
  {
    title: '3.4 Named arguments',
    description: 'Calling parameters explicitly by their names.',
    notes: '📋 Topics to Learn:\n• Calling parameters explicitly for safety\n\n📖 Code Example:\n```kotlin\ngreet(name = "Anirudh")\n```',
    sort_order: 18
  },
  {
    title: '3.5 Unit',
    description: 'Kotlin\'s representation of empty returns.',
    notes: '📋 Topics to Learn:\n• Unit type vs Java void\n• Why Unit can be omitted\n\n📖 Code Example:\n```kotlin\nfun printName(name: String): Unit\n```',
    sort_order: 19
  },
  {
    title: '3.6 Nothing',
    description: 'The bottom type indicating non-returning tasks.',
    notes: '📋 Topics to Learn:\n• Understanding the Nothing type\n• Throwing exceptions or infinite loop representation\n\n📖 Code Example:\n```kotlin\nfun fail(): Nothing {\n    throw Exception()\n}\n```',
    sort_order: 20
  },
  {
    title: '3.7 Local functions',
    description: 'Declaring functions nested inside other functions.',
    notes: '📋 Topics to Learn:\n• Nested function definitions\n• Accessing outer variables scope',
    sort_order: 21
  },
  {
    title: '4.1 Nullable types',
    description: 'Kotlin\'s core null safety boundary.',
    notes: '📋 Topics to Learn:\n• String vs String? types\n• Prevent compile-time NullPointerExceptions\n\n📖 Code Example:\n```kotlin\nvar name: String? = null // Valid\n```',
    sort_order: 22
  },
  {
    title: '4.2 Safe call',
    description: 'Safe calls invoking operations on null targets.',
    notes: '📋 Topics to Learn:\n• safe call ?. operator\n\n📖 Code Example:\n```kotlin\nname?.length // returns Int? or null\n```',
    sort_order: 23
  },
  {
    title: '4.3 Elvis operator',
    description: 'Fallback mappings for null instances.',
    notes: '📋 Topics to Learn:\n• fallback ?: operator\n\n📖 Code Example:\n```kotlin\nval length = name?.length ?: 0\n```',
    sort_order: 24
  },
  {
    title: '4.4 Not-null assertion',
    description: 'Forcing null unwrapping and why it is unsafe.',
    notes: '📋 Topics to Learn:\n• force assertion !! operator\n• Why it is dangerous and leads to crashes\n\n📖 Code Example:\n```kotlin\nname!!.length // throws NullPointerException if null\n```',
    sort_order: 25
  },
  {
    title: '4.5 Safe casting',
    description: 'Type-safe casting returning null on failure.',
    notes: '📋 Topics to Learn:\n• as? casting\n\n📖 Code Example:\n```kotlin\nval text = value as? String\n```',
    sort_order: 26
  },
  {
    title: '4.6 Null checks',
    description: 'Smart casting on null verification gates.',
    notes: '📋 Topics to Learn:\n• Traditional null checks\n• Smart casting inside check gates\n\n📖 Code Example:\n```kotlin\nif (name != null) {\n    println(name.length) // Smart cast to String\n}\n```',
    sort_order: 27
  },
  {
    title: '4.7 let',
    description: 'Scoping nullable properties for execution blocks.',
    notes: '📋 Topics to Learn:\n• let mapping block scope\n• Avoiding excessive nested lets\n\n📖 Code Example:\n```kotlin\nname?.let {\n    println(it)\n}\n```',
    sort_order: 28
  },
  {
    title: '4.8 Nullable collections',
    description: 'Distinguishing null elements and null lists.',
    notes: '📋 Topics to Learn:\n• List<String?> vs List<String>? vs List<String?>?\n\n📖 Study Notes:\nList<String?> has non-null list, elements can be null.\nList<String>? list itself can be null.\nList<String?>? both list and elements can be null.',
    sort_order: 29
  },
  {
    title: 'Phase 5 — Strings',
    description: 'String manipulation, templates, and formatting.',
    notes: '📋 Topics to Learn:\n• String templates\n• Multiline strings with trimIndent() / trimMargin()\n• Common string methods (substring, split, split, split, split)\n• StringBuilder for heavy allocations performance',
    sort_order: 30
  },
  {
    title: 'Phase 6 — Arrays',
    description: 'Array collections and specialized native arrays.',
    notes: '📋 Topics to Learn:\n• Array<T> arrays\n• Optimized native arrays (IntArray, LongArray)\n• Array operations (indexing, search, sorting)\n• arrayOf() and intArrayOf() helpers',
    sort_order: 31
  },
  {
    title: '7.1 Classes',
    description: 'Object-Oriented programming basis in Kotlin.',
    notes: '📋 Topics to Learn:\n• class declaration\n• instances creation\n• properties and method definitions',
    sort_order: 32
  },
  {
    title: '7.2 Constructors',
    description: 'Primary and secondary class constructor rules.',
    notes: '📋 Topics to Learn:\n• Primary constructors\n• Secondary constructors\n• Use cases for secondary constructor blocks',
    sort_order: 33
  },
  {
    title: '7.3 Properties',
    description: 'Getter, setter, backing fields and custom properties.',
    notes: '📋 Topics to Learn:\n• val getters\n• var getters and setters\n• Backing field accessing\n\n📖 Code Example:\n```kotlin\nvar age: Int = 0\n    set(value) {\n        field = value\n    }\n```',
    sort_order: 34
  },
  {
    title: '7.4 Visibility modifiers',
    description: 'Encapsulating code targets inside modules.',
    notes: '📋 Topics to Learn:\n• public / private / protected\n• internal (visible inside the compile module)',
    sort_order: 35
  },
  {
    title: '7.5 init',
    description: 'Custom initialization blocks execution orders.',
    notes: '📋 Topics to Learn:\n• init blocks structure\n• Initialization execution sequence',
    sort_order: 36
  },
  {
    title: '7.6 Inheritance',
    description: 'Extending base class configurations.',
    notes: '📋 Topics to Learn:\n• open classes\n• Method overrides via override\n• final class defaults\n\n📖 Code Example:\n```kotlin\nopen class Animal\nclass Dog : Animal()\n```',
    sort_order: 37
  },
  {
    title: '7.7 Abstract classes',
    description: 'Partially implemented base contracts.',
    notes: '📋 Topics to Learn:\n• abstract classes declaration\n• abstract properties and abstract methods',
    sort_order: 38
  },
  {
    title: '7.8 Interfaces',
    description: 'Class contracts declaring abstract API signatures.',
    notes: '📋 Topics to Learn:\n• Interface properties\n• Default interface method implementations\n• Multiple interface inheritances',
    sort_order: 39
  },
  {
    title: '7.9 Encapsulation',
    description: 'Hiding internal state details for safety.',
    notes: '📋 Topics to Learn:\n• private states\n• public behaviors\n• Android architecture encapsulation strategies',
    sort_order: 40
  },
  {
    title: '8.1 Data classes',
    description: 'Optimized DTO classes with auto implementations.',
    notes: '📋 Topics to Learn:\n• equals() & hashCode()\n• toString()\n• copy() and componentN()\n\n📖 Code Example:\n```kotlin\ndata class User(val id: Int, val name: String)\n```',
    sort_order: 41
  },
  {
    title: '8.2 Enum classes',
    description: 'Strongly typed list declarations of constants.',
    notes: '📋 Topics to Learn:\n• enum class declaration\n• Constant properties values',
    sort_order: 42
  },
  {
    title: '8.3 Sealed classes',
    description: 'Sealed inheritance limits representing States.',
    notes: '📋 Topics to Learn:\n• sealed classes & sealed interfaces\n• Exhaustive when checks for UI States\n\n📖 Code Example:\n```kotlin\nsealed class UiState {\n    object Loading : UiState()\n    data class Success(val list: List<String>) : UiState()\n}\n```',
    sort_order: 43
  },
  {
    title: '8.4 Objects',
    description: 'Singleton pattern bindings inside Kotlin.',
    notes: '📋 Topics to Learn:\n• object singleton declaration\n• Anonymous object expressions',
    sort_order: 44
  },
  {
    title: '8.5 Companion objects',
    description: 'Inner class scopes acting as static alternatives.',
    notes: '📋 Topics to Learn:\n• companion object declarations\n• Kotlin companion objects vs Java static methods',
    sort_order: 45
  },
  {
    title: '8.6 Nested vs inner classes',
    description: 'Outer class context scopes access variables.',
    notes: '📋 Topics to Learn:\n• nested class rules\n• inner class bindings holding parent reference',
    sort_order: 46
  },
  {
    title: 'Phase 9 — Collections',
    description: 'Immutable lists, sets, maps and mutable lists.',
    notes: '📋 Topics to Learn:\n• List, Set, Map collections\n• MutableList, HashSet, HashMap\n• Mutability vs Immutability constraints',
    sort_order: 47
  },
  {
    title: 'Phase 10 — Collection Operations',
    description: 'Functional transformations on collection sequences.',
    notes: '📋 Topics to Learn:\n• Map transformations (map, mapIndexed)\n• Filters (filter, filterNotNull)\n• Search operations (find, firstOrNull)\n• Aggregations (count, sum, maxOrNull)\n• Groupings & Sortings (groupBy, sortedBy)\n• Flattening & Combiners (flatMap, zip)',
    sort_order: 48
  },
  {
    title: 'Phase 11 — Lambdas',
    description: 'Anonymous lambdas blocks syntax.',
    notes: '📋 Topics to Learn:\n• lambda syntax\n• Parameters and return values\n• The implicit it parameter\n• Function types parameters',
    sort_order: 49
  },
  {
    title: 'Phase 12 — Higher-Order Functions',
    description: 'Functions taking or returning other functions.',
    notes: '📋 Topics to Learn:\n• Functions accepting function types\n• Functions returning function types\n\n📖 Code Example:\n```kotlin\nfun calculate(a: Int, b: Int, operation: (Int, Int) -> Int)\n```',
    sort_order: 50
  },
  {
    title: 'Phase 13 — Scope Functions',
    description: 'Scoped execution context containers.',
    notes: '📋 Topics to Learn:\n• let, run, with, apply, also\n• Selecting scope functions appropriately\n\n📖 Grid Reference:\n- apply: Configure object, returns object\n- let: Transform object, returns result\n- also: Side effects, returns object',
    sort_order: 51
  },
  {
    title: 'Phase 14 — Extension Functions',
    description: 'Adding methods to classes without edits.',
    notes: '📋 Topics to Learn:\n• extension functions syntax\n• Extension properties\n\n📖 Code Example:\n```kotlin\nfun String.isValidEmail(): Boolean = this.contains("@")\n```',
    sort_order: 52
  },
  {
    title: 'Phase 15 — Generics',
    description: 'Parameterized classes and type limits.',
    notes: '📋 Topics to Learn:\n• Generic classes & interfaces\n• Type parameters constraints',
    sort_order: 53
  },
  {
    title: '15.1 Variance',
    description: 'Covariance and contravariance generic safety.',
    notes: '📋 Topics to Learn:\n• Covariance (out T)\n• Contravariance (in T)\n• Invariance definitions',
    sort_order: 54
  },
  {
    title: 'Phase 16 — Delegation',
    description: 'Property lazy loaders and class delegation.',
    notes: '📋 Topics to Learn:\n• Class delegation via by\n• Property delegation: lazy evaluation\n• Delegates: observable, vetoable',
    sort_order: 55
  },
  {
    title: 'Phase 17 — Exception Handling',
    description: 'Try, catch, final blocks and lack of checked errors.',
    notes: '📋 Topics to Learn:\n• try/catch/finally\n• throw exceptions\n• Why Kotlin has no checked exceptions',
    sort_order: 56
  },
  {
    title: 'Phase 18 — Kotlin Result',
    description: 'Error container encapsulating results.',
    notes: '📋 Topics to Learn:\n• Result<T>\n• success & failure states\n• getOrNull, fold, onSuccess, onFailure',
    sort_order: 57
  },
  {
    title: 'Phase 19 — Functional Programming',
    description: 'Functional programming paradigms on JVM.',
    notes: '📋 Topics to Learn:\n• pure functions & side effects\n• Immutability bounds\n• Declarative styles prepare for Compose',
    sort_order: 58
  },
  {
    title: 'Phase 20 — Lambdas With Receivers',
    description: 'Defining receiver scope lambdas T.() -> Unit.',
    notes: '📋 Topics to Learn:\n• T.() -> Unit syntax\n• Implicit this scope\n\n📖 Code Example:\n```kotlin\nStringBuilder().apply {\n    append("Hello") // implicit this receiver\n}\n```',
    sort_order: 59
  },
  {
    title: 'Phase 21 — DSL Concepts',
    description: 'Domain-specific structures configuration.',
    notes: '📋 Topics to Learn:\n• Builders concepts\n• Lambdas with receivers, infix, and operator overloads',
    sort_order: 60
  },
  {
    title: 'Phase 22 — Operator Overloading',
    description: 'Extending operator symbols functions.',
    notes: '📋 Topics to Learn:\n• operator functions plus, minus, etc.\n\n📖 Code Example:\n```kotlin\noperator fun plus(other: Point)\n```',
    sort_order: 61
  },
  {
    title: 'Phase 23 — Infix Functions',
    description: 'Defining readable infix operations.',
    notes: '📋 Topics to Learn:\n• infix keyword parameters\n\n📖 Code Example:\n```kotlin\ninfix fun String.shouldBe(expected: String)\n```',
    sort_order: 62
  },
  {
    title: 'Phase 24 — Destructuring',
    description: 'Destructuring class values into variables.',
    notes: '📋 Topics to Learn:\n• componentN() functions\n• Destructuring declarations in loops and maps',
    sort_order: 63
  },
  {
    title: 'Phase 25 — Type System',
    description: 'Type system hierarchy from Any to Nothing.',
    notes: '📋 Topics to Learn:\n• Any, Unit, Nothing types\n• Nullable and Non-null types\n• Type hierarchies',
    sort_order: 64
  },
  {
    title: 'Phase 26 — Smart Casts',
    description: 'Smart casting limits and capabilities.',
    notes: '📋 Topics to Learn:\n• smart casting trigger rules\n• smart casting limits in mutable properties',
    sort_order: 65
  },
  {
    title: 'Phase 27 — Advanced Functions',
    description: 'Performance functions: inline and reified.',
    notes: '📋 Topics to Learn:\n• inline, noinline, crossinline\n• reified type parameters inside inline functions',
    sort_order: 66
  },
  {
    title: 'Phase 28 — Inline Classes / Value Classes',
    description: 'Lightweight wrapper value classes.',
    notes: '📋 Topics to Learn:\n• @JvmInline value classes\n• Type safety without heap boxing overhead',
    sort_order: 67
  },
  {
    title: 'Phase 29 — Sequences',
    description: 'Lazy evaluation sequences on lists.',
    notes: '📋 Topics to Learn:\n• asSequence() lazy mapping\n• Sequence performance benefits on large lists',
    sort_order: 68
  },
  {
    title: 'Phase 30 — Kotlin Coroutines',
    description: 'Structured concurrency asynchronous execution.',
    notes: '📋 Topics to Learn:\n• Blocking vs Non-blocking threads\n• Suspend functions and light-weight execution',
    sort_order: 69
  },
  {
    title: 'Phase 31 — Coroutine Builders',
    description: 'Starting coroutine thread boundaries.',
    notes: '📋 Topics to Learn:\n• launch & async builders\n• runBlocking and withContext contexts',
    sort_order: 70
  },
  {
    title: 'Phase 32 — Suspending Functions',
    description: 'The suspend keyword mechanics.',
    notes: '📋 Topics to Learn:\n• suspend functions boundaries\n• suspension vs blocking thread execution',
    sort_order: 71
  },
  {
    title: 'Phase 33 — Dispatchers',
    description: 'Managing thread pool executors.',
    notes: '📋 Topics to Learn:\n• Dispatchers: Main, IO, Default, Unconfined',
    sort_order: 72
  },
  {
    title: 'Phase 34 — Coroutine Context',
    description: 'Combining coroutine context components.',
    notes: '📋 Topics to Learn:\n• CoroutineContext composition\n• Job, Dispatcher, CoroutineName, ExceptionHandler',
    sort_order: 73
  },
  {
    title: 'Phase 35 — Coroutine Jobs',
    description: 'Managing coroutine execution handles.',
    notes: '📋 Topics to Learn:\n• Job states\n• Parent-child cancel propagation relationships',
    sort_order: 74
  },
  {
    title: 'Phase 36 — Exception Handling in Coroutines',
    description: 'Error handler and supervisor scopes.',
    notes: '📋 Topics to Learn:\n• try/catch inside coroutines\n• CoroutineExceptionHandler\n• SupervisorJob vs standard Job',
    sort_order: 75
  },
  {
    title: 'Phase 37 — Coroutine Cancellation',
    description: 'Active cooperative cancels in thread execution.',
    notes: '📋 Topics to Learn:\n• check isActive, yield() and ensureActive()',
    sort_order: 76
  },
  {
    title: 'Phase 38 — Flow',
    description: 'Reactive cold data streams emitter.',
    notes: '📋 Topics to Learn:\n• flow builder\n• emit() and collect() operations',
    sort_order: 77
  },
  {
    title: 'Phase 39 — Flow Operators',
    description: 'Transforming and collecting cold streams.',
    notes: '📋 Topics to Learn:\n• map, filter, combine, flatMapLatest\n• collect vs collectLatest',
    sort_order: 78
  },
  {
    title: 'Phase 40 — StateFlow',
    description: 'Active state holder hot stream.',
    notes: '📋 Topics to Learn:\n• MutableStateFlow & StateFlow\n• State updates collections in Compose views',
    sort_order: 79
  },
  {
    title: 'Phase 41 — SharedFlow',
    description: 'Broadcasting hot stream event streams.',
    notes: '📋 Topics to Learn:\n• SharedFlow events broadcast\n• buffer limits and replay configurations',
    sort_order: 80
  }
];
