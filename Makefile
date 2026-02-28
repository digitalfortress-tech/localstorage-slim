help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install Dependencies
	@pnpm install

dev:	## Build and watch for changes
	@pnpm run dev

lint:		## Lint all files
	@pnpm run lint

test:		## Run unit tests (JEST)
	@pnpm run test

prod:		## Build for Production environment
	@pnpm run prod

publish:	## Publish to NPM
	@make prod
	@make test
	@pnpm publish
