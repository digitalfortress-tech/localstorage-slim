help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

install: ## Install Dependencies
	@npm i

watch:	## Build for Dev environment and Watch files
	@npm run watch

lint:		## Lint all files
	@npm run lint

test:		## Run unit tests (JEST)
	@npm run test

prod:		## Build for Production environment
	@npm run prod

publish:	## Publish to NPM
	@make test
	@make prod
	@npm publish
