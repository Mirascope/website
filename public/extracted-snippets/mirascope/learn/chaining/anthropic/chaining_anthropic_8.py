#!/usr/bin/env python3
# Example 8: Advanced Chaining Techniques
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/chaining.mdx:234
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import BaseDynamicConfig, llm, prompt_template
from pydantic import BaseModel


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template(
    """
    Please identify a chef who is well known for cooking with {ingredient}.
    Respond only with the chef's name.
    """
)
async def chef_selector(ingredient: str): ...


class IngredientsList(BaseModel):
    ingredients: list[str]


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=IngredientsList)
@prompt_template(
    """
    Given a base ingredient {ingredient}, return a list of complementary ingredients.
    Make sure to exclude the original ingredient from the list.
    """
)
async def ingredients_identifier(ingredient: str): ...


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template(
    """
    SYSTEM:
    Your task is to recommend a recipe. Pretend that you are chef {chef}.

    USER:
    Recommend recipes that use the following ingredients:
    {ingredients}
    """
)
async def recipe_recommender(ingredient: str) -> BaseDynamicConfig:
    chef, ingredients = await asyncio.gather(
        chef_selector(ingredient), ingredients_identifier(ingredient)
    )
    return {"computed_fields": {"chef": chef, "ingredients": ingredients}}


async def run():
    response = await recipe_recommender(ingredient="apples")
    print(response.content)


asyncio.run(run())
