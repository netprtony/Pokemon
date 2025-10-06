import scrapy
from scrapy_playwright.page import PageMethod


class TCGPlayerSpider(scrapy.Spider):
    name = "tcgplayerspider"
    allowed_domains = ["tcgplayer.com"]

    def start_requests(self):
        url = getattr(self, "url", None)
        if not url:
            self.logger.error("⚠️ Cần truyền URL: scrapy crawl tcgplayerspider -a url='...'")
            return

        yield scrapy.Request(
            url,
            meta={
                "playwright": True,
                "playwright_page_methods": [
                    PageMethod("wait_for_load_state", "networkidle"),
                    PageMethod("wait_for_selector", "section.listing-item", timeout=60000),
                    PageMethod("wait_for_timeout", 5000),  # đợi thêm 5s
                ],
                "playwright_context": "default",
            },
            callback=self.parse,
        )

    async def parse(self, response):
        self.logger.info(f"✅ Đang crawl: {response.url}")

        # Debug nếu không có dữ liệu
        if not response.css("section.listing-item"):
            self.logger.warning("⚠️ Không tìm thấy section.listing-item, lưu HTML để kiểm tra")
            with open("debug.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            return

        listings = response.css("section.listing-item")
        self.logger.info(f"📦 Số lượng listing: {len(listings)}")

        results = []
        for item in listings:
            condition = item.css(".listing-item__listing-data__info__condition a::text").get()
            price = item.css(".listing-item__listing-data__info__price::text").get()

            if condition and price:
                results.append({
                    "condition": condition.strip(),
                    "price": price.strip()
                })

        yield {
            "url": response.url,
            "listings": results
        }
