# labelit.ai

[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

## Architecture

```mermaid

flowchart TD
    subgraph Sources
        BB[Jira]
        GH[GitHub]
        GL[GitLab]
    end

    subgraph EventIngestion
        WH[Webhook Service]
        Q[Queue System]
        C[Cache Layer]
    end

    subgraph Processing
        CF[Cloudflare Workers]
        AI[AI Processing Service]
        AGG[Aggregator Service]
    end

    subgraph Storage
        DB[(Database)]
        ML[(Model Training Data)]
    end

    subgraph Output
        LAB[Labeling Service]
        API[API Service]
    end

    BB --> WH
    GH --> WH
    GL --> WH
    WH --> Q
    Q --> CF
    CF --> C
    C --> AI
    AI --> AGG
    AGG --> LAB
    LAB --> DB
    LAB --> ML
    LAB --> API
    ML --> AI
```

## TODO

- [ ] Webhook security
  - [ ] Github
  - [ ] Gitlab
  - [ ] JIRA
- [ ] Unit testing
  - [ ] AI
  - [ ] Config
  - [ ] Service
  - [ ] Types
  - [ ] Utils
  - [ ] Webhook
  - [ ] Worker
- [ ] Integrations
  - [ ] Apps
    - [ ] Github
    - [ ] Gitlab
    - [ ] JIRA
  - [x] Knip
  - [x] Turborepo
