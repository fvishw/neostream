resource "aws_lb" "public_lb" {
  name                       = "${var.prefix_name}-public-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = var.public_alb_sg_id
  subnets                    = var.public_subnet_ids
  enable_deletion_protection = false

  tags = {
    Name = "${var.prefix_name}-public-alb"
  }
}

resource "aws_alb_target_group" "web" {
  name     = "${var.prefix_name}-web-tg"
  port     = var.web_port
  protocol = "HTTP"
  vpc_id   = var.vpc_id


  target_type = "instance"

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.prefix_name}-web-tg"
  }
}

resource "aws_lb_listener" "public_http" {
  load_balancer_arn = aws_alb_target_group.web.arn

  port     = 80
  protocol = "HTTP"
  default_action {
    type             = "forword"
    target_group_arn = aws_alb_target_group.web.arn
  }

}


resource "aws_alb" "internal" {
  name               = "${var.prefix_name}-internal-alb"
  internal           = true
  security_groups    = var.internal_alb_sg_id
  load_balancer_type = "application"
  subnets            = var.internal_subnet_ids

  enable_deletion_protection = false

  tags = {
    "name" = "${var.prefix_name}-internal-alb"
  }
}

resource "aws_alb_target_group" "app" {
  name     = "${var.prefix_name}-internal-alb-tg"
  port     = var.app_port
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled  = true
    path     = "/health"
    protocol = "HTTP"

    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30

    matcher = "200-399"
  }

}

resource "aws_alb_listener" "internal" {
  load_balancer_arn = aws_alb.internal.arn

  port     = 80
  protocol = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.app.arn
  }
}