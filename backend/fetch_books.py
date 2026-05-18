import json
from urllib.error import URLError
from urllib.request import urlopen

categories = {
    "Fantasy": "fantasy",
    "Science Fiction": "science_fiction",
    "Mystery": "mystery_and_detective_stories",
    "Romance": "romance",
    "Historical Fiction": "historical_fiction",
    "Horror": "horror",
    "Young Adult": "young_adult_fiction",
    "Adventure": "adventure",
    "Classics": "classics",
    "Biography": "biography",
}

seen_titles = set()

for category_name, slug in categories.items():
    url = f"https://openlibrary.org/subjects/{slug}.json?limit=50"
    try:
        with urlopen(url, timeout=10) as response:
            if response.status != 200:
                continue

            data = json.load(response)
        works = data.get("works", [])

        count = 0
        for work in works:
            if count >= 10:
                break

            title = work.get("title")
            if not title or title in seen_titles:
                continue

            authors = work.get("authors", [])
            author_name = authors[0].get("name") if authors else "Unknown"
            year = work.get("first_publish_year", "Unknown")

            print(f"{category_name}\t{title}\t{author_name}\t{year}")
            seen_titles.add(title)
            count += 1
    except (URLError, TimeoutError, json.JSONDecodeError, OSError):
        continue
    except Exception:
        continue
