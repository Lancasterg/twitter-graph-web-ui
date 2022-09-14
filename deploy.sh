npm run build
aws s3 cp dist/ s3://twitvis.jls.ai/ --recursive
