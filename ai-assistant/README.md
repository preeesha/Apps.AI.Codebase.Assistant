# AI Assistant

Rocket Chatter is a Rocket.Chat bot that provides code-related information and assistance to developers working on the Rocket Chat project. The bot is designed to help developers understand the Rocket Chat codebase, find relevant documentation, and improve their coding practices. Rocket Chatter uses the Rocket Chat API to access the codebase and provide context-specific information and suggestions to users.

## Commands

### `/rcc-help`

Provides descriptions and usage instructions for all available Rocket Chatter commands.

```
/rcc-help
```

### `/rcc-askcode`

Allows users to ask specific code-related questions about the Rocket Chat's codebase and receive context-specific answers.

```
/rcc-askcode [your query]
```

### `/rcc-askdocs`

Accesses and provides developer documentation related to the Rocket Chat project, including setup guides, API references, and contribution guidelines.

```
/rcc-askdocs [your query]
```

### `/rcc-diagram`

Generates clarifying diagrams to visually represent the relationships and structures between an entity and it's dependencies within the Rocket Chat codebase.

```
/rcc-diagram [entity]
```

### `/rcc-document`

Generates the documentation for a specific entity within the Rocket Chat codebase.

```
/rcc-document [entity]
```

### `/rcc-findsimilar`

Finds similar entities to the one provided within the Rocket Chat codebase to reduce redundancy and improve code quality.

```
/rcc-findsimilar
```

(A modal will open to input the code snippet you want to find similar entities to)

### `/rcc-improve`

Offers suggestions for code improvements, refactoring, or enhancements based on best practices and project standards.

```
/rcc-improve
```

(A modal will open to input the code snippet you want to suggest improvements for)

### `/rcc-importance`

Determines and explains the importance of a specific code entity within the larger context of the Rocket Chat codebase.

```
/rcc-importance [entity]
```

### `/rcc-testcases`

Generates test cases for the provided code which uses Rocket Chat codebase to ensure proper functionality and test coverage.

```
/rcc-testcases
```

(A modal will open to input the code snippet you want to generate testcases for)

### `/rcc-translate`

Translates the target entity from one programming language to another for a better understanding of the codebase.

```
/rcc-translate [entity] [target language]
```

### `/rcc-whyused`

Explains why a specific entity is used within the Rocket Chat codebase.

```
/rcc-whyused [entity]
```
