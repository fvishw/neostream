output "public_alb_arn" {
  value       = aws_lb.public_lb.arn
  description = "ARN of the public ALB"
}

output "public_alb_dns_name" {
  value       = aws_lb.public_lb.dns_name
  description = "DNS name of the public ALB"
}

output "internal_alb_arn" {
  value       = aws_alb.internal.arn
  description = "ARN of the internal ALB"
}
output "internal_alb_dns_name" {
  value       = aws_alb.internal.dns_name
  description = "DNS name of the internal ALB"
}

output "web_target_group_arn" {
  value       = aws_alb_target_group.web.arn
  description = "ARN of the web target group"
}
output "app_target_group_arn" {
  value       = aws_alb_target_group.app.arn
  description = "ARN of the app target group"
}