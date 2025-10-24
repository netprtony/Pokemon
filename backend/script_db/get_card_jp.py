from tcgdexsdk import Language, TCGdex
from tcgdexsdk.enums import Extension

# Init the SDK
tcgdex = TCGdex()
# Initialize with language as string
tcgdex = TCGdex("ja")

# Or using the Language enum
tcgdex = TCGdex(Language.JA)
card = tcgdex.card.getSync("PMCG6-001")
print(card)
