# C4Future — common dev commands. Run `make` to see all.
.DEFAULT_GOAL := help
.PHONY: help install run train ingest test lint docker-build docker-up clean

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install:  ## Install Python dependencies
	pip install -r requirements.txt

migrate:  ## Run Django migrations
	python manage.py makemigrations
	python manage.py migrate

run:  ## Start dev server
	python manage.py runserver

train:  ## Train the XGBoost predictor
	python predictor/training/train_xgboost.py

train-legacy:  ## Train the original RandomForest
	python predictor/training/train_model.py

ingest:  ## Seed the RAG knowledge base
	python manage.py ingest_seed

eval:  ## Run RAG advisor evaluation
	python manage.py eval_advisor

test:  ## Run all tests
	pytest -q

lint:  ## Run ruff linter
	ruff check .

docker-build:  ## Build production Docker image
	docker build -t c4future:local .

docker-up:  ## Run full stack locally
	docker compose up -d

docker-down:  ## Stop stack
	docker compose down

clean:  ## Remove caches + vector store + model
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	rm -rf advisor/chroma_store/* .pytest_cache mlruns/
