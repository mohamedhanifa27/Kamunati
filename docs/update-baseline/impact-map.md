# Impact Map

| Area | Risk | Reason |
| --- | --- | --- |
| App Shell / Nav | Medium | Global layout shifts could affect z-indexes. |
| Global Styles | Low | Pure additive tokens. |
| Media Cards | High | Highly interactive elements touching 3D WebGL hooks. |
| Search UI | Low | Only an overlay / intercept. |
| Profiles / Lists | High | Fundamental data structure shifts (Multi to single). |
| Settings | Medium | Auth flows touch sensitive token management. |
| Admin Area | Medium | Complex data relationships (cascade vs set null). |
| Prisma Schema | High | Data loss potential during multi-to-single migration. |
