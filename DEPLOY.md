Instruction useful before pushing:
- Update the `SESSION.md`
- Update the `version` in `package.json` and `package-lock.json`
- Update the `CHANGELOG.md`
- Update the `TODO.md` if there are tasks completed or new task added.
- Eventually, update the `README.md` if there are any breaking changes or new features that need to be highlighted.
- Eventually, run `npm typecheck` and `npm lint` to ensure there are no type errors or linting issues before deploying.
- Eventually, run `npm test test:api` to ensure all tests are passing before deploying.
- Commit the changes with a meaningful commit message, e.g., "chore: update version to x.y.z and update changelog" (don't do push in parallel, wait for the commit to be done).
- Push the changes to the repository.