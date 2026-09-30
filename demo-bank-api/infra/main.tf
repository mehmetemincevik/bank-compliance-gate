terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

provider "aws" {
  region = "eu-central-1"
}

provider "aws" {
  alias  = "backup"
  region = "eu-west-1"
}

resource "aws_db_instance" "core" {
  identifier        = "corebank-db"
  engine            = "postgres"
  instance_class    = "db.m6g.large"
  allocated_storage = 200
  storage_encrypted = true
}

resource "aws_s3_bucket" "statement_backups" {
  provider = aws.backup
  bucket   = "corebank-statement-backups"
}

resource "aws_lb" "api" {
  name               = "corebank-api"
  load_balancer_type = "application"
  subnets            = var.public_subnets
}

resource "aws_lb_listener" "api_http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = var.api_target_group_arn
  }
}

variable "public_subnets" { type = list(string) }
variable "api_target_group_arn" { type = string }
