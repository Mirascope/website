#!/usr/bin/env python3
# Example 9: Image Inputs
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/prompts.mdx:300
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template
from PIL import Image


@prompt_template(
    "I just read this book: {previous_book:image} What should I read next?" # [!code highlight]
)
def recommend_book_prompt(previous_book: Image.Image): ...


with Image.open("path/to/image.jpg") as image:
    print(recommend_book_prompt(image))
# Output: [
#   BaseMessageParam(
#     role='user',
#     content=[
#       ContentPartParam(type='text', text='I just read this book:'), # [!code highlight]
#       ContentPartParam(type='image', image=<PIL.JpegImagePlugin.JpegImageFile image mode=RGB size=1000x1000>), # [!code highlight]
#       ContentPartParam(type='text', text='What should I read next?') # [!code highlight]
#     ]
#   )
# ]
