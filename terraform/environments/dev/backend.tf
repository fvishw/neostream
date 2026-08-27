terraform {
  backend "s3" {
    bucket = "neostream-tfstate-389352669036"
    key = "neostream/dev/terraform.tfstate"
    region = "ap-south-1"
    encrypt = true
    use_lockfile = true
  }
}