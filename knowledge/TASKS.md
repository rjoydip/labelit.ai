# labelit.ai Development Tasks

This file tracks ongoing and planned development tasks for the labelit.ai project.

## Current Sprint Tasks

### High Priority

- [x] Migrate from `ESLint` to `oxlint` in all packages
- [x] Update root `package.json` scripts to use `oxlint`
- [x] Update `simple-git-hooks` configuration
- [x] Remove `ESLint` dependencies from all `package.json` files
- [x] Add `oxlint` and `oxfmt` as devDependencies

### Medium Priority

- [x] Create scripts folder for utility scripts
- [x] Add basic utility scripts (`setup`, `cleanup`, etc.)
- [x] Integrate `actions-up` for GitHub Actions
- [x] Create initial `GitHub Actions` workflows
- [x] Create `/docs` directory structure

### Low Priority

- [x] Add contributing guidelines
- [x] Create `license` file if missing
- [x] Add repository `badges` to README

## Backlog

### Code Quality

- [x] Implement oxfmt for code formatting
- [x] Add oxfmt configuration
- [x] Set up automated code formatting on `pre-commit`
- [x] Create code quality dashboards

### Testing

- [x] Write unit tests for AI service
- [x] Write unit tests for services package
- [x] Write unit tests for utils package
- [ ] Write integration tests for webhook handling
- [x] Add test coverage reporting

### Documentation

- [ ] Create API documentation
- [x] Create architecture decision records
- [ ] Develop onboarding guide for new developers
- [ ] Create deployment documentation
- [ ] Document environment variable requirements

### Features

- [ ] Implement webhook signature verification
- [ ] Add `GitHub` webhook security
- [ ] Add `GitLab` webhook security
- [ ] Add `Jira` webhook security
- [ ] Complete AI processing pipeline
- [ ] Implement label confidence scoring
- [ ] Create aggregator service
- [ ] Build labeling service

### Infrastructure

- [ ] Add monitoring and alerting
- [ ] Implement structured logging
- [ ] Add metrics collection (`Prometheus` compatible)
- [ ] Create health check endpoints
- [ ] Add rate limiting
- [ ] Implement caching layer

### DevOps

- [ ] Create `Dockerfile` for local development
- [ ] Add `Kubernetes` deployment manifests
- [ ] Create staging/production environment configs
- [ ] Implement `blue-green` deployment strategy
- [ ] Add backup and disaster recovery procedures

## Completed Tasks

- [x] Analyzed codebase structure and dependencies
- [x] Created `AGENTS.md` with agent usage guidelines
- [x] Updated `README.md` with project overview and setup instructions
- [x] Created `PLAN.md` outlining development roadmap
- [x] Created this `TASKS.md` file
- [x] Removed `ESLint` and replaced with `oxlint` in monorepo setup
- [x] Introduced `oxfmt` for code formatting across all packages
- [x] Created scripts folder for utility and maintenance scripts
- [x] Generated markdown documentation and created `/docs` directory
- [x] Integrated `actions-up` for `GitHub Actions` workflow management

## Task Tracking Notes

### Priority Levels

- **High**: Blocking tasks or essential for next release
- **Medium**: Important but not blocking
- **Low**: Nice to have or technical debt

### Status Indicators

- [ ] Not started
- [-] In progress
- [x] Completed
- [~] Blocked
- [!] At risk

### Assignment

Tasks can be assigned by adding @username after the task description.

### Estimation

Consider adding time estimates using `(Xh)` or `(Xd)` notation for larger tasks.

## References

- See `PLAN.md` for detailed roadmap
- See `DECISION.md` for architectural decisions
- See `AGENTS.md` for AI agent usage guidelines
