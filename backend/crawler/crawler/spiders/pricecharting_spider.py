import scrapy
import requests

class PriceChartingSpider(scrapy.Spider):
    name = "pricecharting"
    allowed_domains = ["pricecharting.com"]

    def start_requests(self):
        version_en = getattr(self, "version_en", "base-set")
        name_en = getattr(self, "name_en", "charizard")
        card_number = getattr(self, "card_number", "025/102")

        version_en = version_en.lower().replace(" ", "-")
        name_en = name_en.lower().replace(" ", "-")
        card_number_short = card_number.split('/')[0]

        url = f"https://www.pricecharting.com/game/pokemon-{version_en}/{name_en}-{card_number_short}#used-prices"
        yield scrapy.Request(url, callback=self.parse)

    def parse(self, response):
        result = {}

        # ✅ Lấy bảng chính của các grade (giá theo condition)
        anchor = response.xpath('//a[@name="full-prices"]')
        table = anchor.xpath('following::table[1]')
        if table:
            rows = table.xpath('.//tr')
            for row in rows:
                key = row.xpath('./td[1]//text()').get()
                value = row.xpath('./td[2]//text()').get()
                if key and value:
                    result[key.strip()] = value.strip()

        # ✅ Lấy tất cả bảng có class "used-prices condition-comparison"
        price_tables = response.xpath('//table[contains(@class, "used-prices") and contains(@class, "condition-comparison")]')
        result["url"] = response.url
        for idx, tbl in enumerate(price_tables, start=1):
            # 🧾 eBay
            ebay_row = tbl.xpath('.//tr[@data-source-name="eBay"]')
            if ebay_row:
                ebay_price = ebay_row.xpath('.//td[contains(@class, "price")]/span[contains(@class, "js-price")]/text()').get()
                ebay_link = ebay_row.xpath('.//td[contains(@class, "see-it")]/a/@href').get()
                result[f"eBay_price_table_{idx}"] = ebay_price.strip() if ebay_price else None
                result[f"eBay_link_table_{idx}"] = response.urljoin(ebay_link) if ebay_link else None

            # 🧾 TCGPlayer
            tcg_row = tbl.xpath('.//tr[@data-source-name="TCGPlayer"]')
            if tcg_row:
                tcg_price = tcg_row.xpath('.//td[contains(@class, "price")]/span[contains(@class, "js-price")]/text()').get()
                tcg_link = tcg_row.xpath('.//td[contains(@class, "see-it")]/a/@href').get()
                result[f"TCGPlayer_price_table_{idx}"] = tcg_price.strip() if tcg_price else None
                result[f"TCGPlayer_link_table_{idx}"] = response.urljoin(tcg_link) if tcg_link else None

        # Lấy tỷ giá USD/VND
        try:
            usd_resp = requests.get("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", timeout=10)
            usd_json = usd_resp.json()
            result["usd_to_vnd_rate"] = float(usd_json["usd"]["vnd"])
        except Exception:
            result["usd_to_vnd_rate"] = None

        # Lấy tỷ giá JPY/VND
        try:
            jpy_resp = requests.get("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json", timeout=10)
            jpy_json = jpy_resp.json()
            result["jpy_to_vnd_rate"] = float(jpy_json["jpy"]["vnd"])
        except Exception:
            result["jpy_to_vnd_rate"] = None

        yield result
