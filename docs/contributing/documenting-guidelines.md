---
sidebar_position: 1
title: Documentation Guidelines
description: Guidelines for contributing to the community documentation
---

# Documentation Guidelines

These guidelines will help ensure that community documentation provides unique value while avoiding redundancy with the official documentation.

## Core Principles

1. **Don't duplicate, complement**: Focus on providing content that complements the official documentation
2. **Reference official docs**: Always link to relevant official documentation
3. **Focus on practical deployment**: Emphasize real-world deployment scenarios, configurations, and troubleshooting
4. **Community knowledge**: Share experiences and insights not found in the official documentation

## Documentation Template

When creating a new document, use this template as a starting point:

```md
---
sidebar_position: [position number]
title: [Document Title]
description: [Brief description of the document content]
---

# [Document Title]

[Brief introduction to the topic]

:::info Official Documentation
This content complements the official documentation on [Topic Name](link-to-official-docs).
Please refer to the official documentation for core concepts and functionality.
:::

## [Main content sections]

[Detailed, practical guidance specific to deployment and operation]

## Related Information

- [Link to related community docs]
- [Link to related official docs]
```

## Before You Write

1. **Check the [Official Documentation Map](../reference/official-docs-map.md)** to see if the topic is already covered
2. **Review existing community documentation** to avoid duplication
3. **Identify the unique value** your content will provide beyond the official documentation

## Content Focus Areas

Focus on these types of content that complement rather than duplicate official documentation:

- **Step-by-step deployment guides** for specific scenarios
- **Integration examples** with external systems
- **Configuration recipes** for common use cases
- **Troubleshooting guides** based on real-world experience
- **Performance optimization** tips and best practices
- **Security hardening** recommendations
- **Operational procedures** for day-to-day management

## Example Information Banner

For convenient reference to the official documentation, include an information banner at the top of your document. Here's an example:

```jsx
:::info Official Documentation
For detailed information about Keycloak configuration, refer to the 
[Authentication Setup](https://opentalk.eu/docs/admin/controller/auth/) 
in the official documentation. This guide focuses specifically on 
deployment-specific aspects not covered in the official documentation.
:::
```

This banner should:
- Clearly identify related official documentation
- Provide direct links to the relevant sections
- Briefly explain how your content complements the official docs

By following these guidelines, we can create a valuable community documentation resource that works alongside the official documentation rather than duplicating it.