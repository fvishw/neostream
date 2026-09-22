resource "aws_security_group" "public_alb_sg" {
  vpc_id      = var.vpc_id
  name        = "${var.name_prefix}-public-alb-sg"
  description = "Security group for public ALB"

  tags = {
    name = "${var.name_prefix}-public-alb-sg"
  }
}
resource "aws_security_group" "internal_alb_sg" {
  vpc_id      = var.vpc_id
  name        = "${var.name_prefix}-internal-alb-sg"
  description = "Security group for internal ALB"

  tags = {
    name = "${var.name_prefix}-internal-alb-sg"
  }
}

resource "aws_security_group" "web_sg" {
  vpc_id      = var.vpc_id
  name        = "${var.name_prefix}-web-sg"
  description = "Security group for web servers"

  tags = {
    name = "${var.name_prefix}-web-sg"
  }
}

resource "aws_security_group" "app_sg" {
  vpc_id      = var.vpc_id
  name        = "${var.name_prefix}-app-sg"
  description = "Security group for app servers"

  tags = {
    name = "${var.name_prefix}-app-sg"
  }
}
resource "aws_security_group" "db_sg" {
  vpc_id      = var.vpc_id
  name        = "${var.name_prefix}-db-sg"
  description = "Security group for database servers"

  tags = {
    name = "${var.name_prefix}-db-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "public_alb_http" {
  security_group_id = aws_security_group.public_alb_sg.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"

  description = "Allow HTTP traffic from the internet to the public ALB"
}

resource "aws_vpc_security_group_ingress_rule" "public_alb_https" {
  security_group_id = aws_security_group.public_alb_sg.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"

  description = "Allow HTTPS traffic from the internet to the public ALB"
}

resource "aws_vpc_security_group_egress_rule" "public_alb_to_web" {
  security_group_id = aws_security_group.public_alb_sg.id

  ip_protocol                  = "tcp"
  from_port                    = var.web_port
  to_port                      = var.web_port
  referenced_security_group_id = aws_security_group.web_sg.id
  description                  = "Allow traffic from public ALB to web servers"
}

resource "aws_vpc_security_group_ingress_rule" "web_to_public_alb" {
  security_group_id = aws_security_group.web_sg.id

  ip_protocol                  = "tcp"
  from_port                    = var.web_port
  to_port                      = var.web_port
  referenced_security_group_id = aws_security_group.public_alb_sg.id
  description                  = "Allow traffic from public ALB to web servers"
}

resource "aws_vpc_security_group_egress_rule" "web_egress" {
  security_group_id = aws_security_group.web_sg.id

  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"
  description = "Allow all outbound traffic from web servers"
}


resource "aws_vpc_security_group_egress_rule" "internal_alb_to_app" {
  security_group_id = aws_security_group.internal_alb_sg.id

  ip_protocol                  = "tcp"
  from_port                    = var.internal_alb_port
  to_port                      = var.internal_alb_port
  referenced_security_group_id = aws_security_group.app_sg.id

  description = "Allow traffic from internal ALB to app servers"
}

resource "aws_vpc_security_group_ingress_rule" "app_to_internal_alb" {
  security_group_id = aws_security_group.app_sg.id

  ip_protocol                  = "tcp"
  from_port                    = var.internal_alb_port
  to_port                      = var.internal_alb_port
  referenced_security_group_id = aws_security_group.internal_alb_sg.id

  description = "Allow traffic from app servers to internal ALB"
}

resource "aws_vpc_security_group_egress_rule" "app_egress" {
  security_group_id = aws_security_group.app_sg.id

  ip_protocol = "-1"
  cidr_ipv4   = "0.0.0.0/0"
  description = "Allow all outbound traffic from app servers"
}

resource "aws_vpc_security_group_ingress_rule" "database_from_app" {
  security_group_id            = aws_security_group.db_sg.id
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.app_sg.id
  from_port                    = var.db_port
  to_port                      = var.db_port

  description = "Allow traffic from app servers to database servers"
}