import scrapy
import requests

class PriceChartingSpider(scrapy.Spider):
    name = "pricecharting"
    allowed_domains = ["pricecharting.com"]

    def __init__(self, version_en=None, name_en=None, card_number=None, url=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.version_en = version_en
        self.name_en = name_en
        self.card_number = card_number
        self.start_url = url

    def start_requests(self):
        # Nếu truyền url thì crawl trực tiếp url đó
        if self.start_url:
            yield scrapy.Request(self.start_url, callback=self.parse)
        else:
            version_en = (self.version_en or "base-set").lower().replace(" ", "-")
            name_en = (self.name_en or "charizard").lower().replace(" ", "-")
            card_number_short = (self.card_number or "025/102").split('/')[0]
            url = f"https://www.pricecharting.com/game/{version_en}/{name_en}-{card_number_short}#used-prices"
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

        # Kiểm tra nếu chỉ crawl được url, usd_to_vnd_rate, jpy_to_vnd_rate
        only_url_and_rates = (
            len(result) == 3 and
            "url" in result and
            "usd_to_vnd_rate" in result and
            "jpy_to_vnd_rate" in result
        )
        print("only_url_and_rates:", only_url_and_rates)
        # Nếu thiếu dữ liệu, vào link url tìm table games_table và crawl lại
        if only_url_and_rates:
            games_table = response.xpath('//table[contains(@class, "games_table")]')
            if games_table:
                # Lấy dòng đầu tiên trong tbody
                first_row = games_table.xpath('.//tbody/tr[1]')
                # Lấy href của thẻ a trong td có class title
                href = first_row.xpath('.//td[contains(@class, "title")]/a/@href').get()
                print("Retrying with link:", href)
                if href:
                    next_url = response.urljoin(href)
                    yield scrapy.Request(next_url, callback=self.parse)
                    return

        yield result
