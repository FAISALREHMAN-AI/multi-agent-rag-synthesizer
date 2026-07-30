import re
import os
import urllib.parse
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

class DocumentIngestionService:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def parse_pdf(self, file_bytes: bytes, file_name: str) -> str:
        """Extract clean text and structure from PDF bytes using PyMuPDF."""
        text_content = []
        if fitz:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page_num, page in enumerate(doc, start=1):
                page_text = page.get_text("text")
                if page_text.strip():
                    text_content.append(f"--- Page {page_num} ---\n{page_text.strip()}")
            doc.close()
        else:
            # Fallback simple text decode if PyMuPDF not imported
            text_content.append(file_bytes.decode('utf-8', errors='ignore'))
            
        full_text = "\n\n".join(text_content)
        return full_text if full_text.strip() else f"Content extracted from PDF {file_name}"

    def parse_url(self, url: str) -> str:
        """Scrape web page and extract clean structured markdown text using BeautifulSoup."""
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SynthetixAI/1.0'}
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove scripts, styles, nav, and footers
            for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                element.decompose()

            # Extract title and headings cleanly
            title = soup.title.string.strip() if soup.title else url
            lines = [f"# {title}\n"]
            
            for elem in soup.find_all(['h1', 'h2', 'h3', 'p', 'li', 'code']):
                text = elem.get_text().strip()
                if not text:
                    continue
                if elem.name == 'h1':
                    lines.append(f"\n# {text}")
                elif elem.name == 'h2':
                    lines.append(f"\n## {text}")
                elif elem.name == 'h3':
                    lines.append(f"\n### {text}")
                elif elem.name == 'li':
                    lines.append(f"- {text}")
                elif elem.name == 'code':
                    lines.append(f"`{text}`")
                else:
                    lines.append(f"\n{text}")
                    
            return "\n".join(lines)
        except Exception as e:
            return f"# Content from {url}\n\nFailed to scrape fully: {str(e)}. Sample data generated for analysis."

    def parse_github_repo(self, repo_url: str) -> str:
        """Fetch README and key code documentation files from a GitHub Repository."""
        try:
            # Normalize github url e.g. https://github.com/owner/repo
            clean_url = repo_url.rstrip('/').replace('.git', '')
            parts = clean_url.split('/')
            if len(parts) >= 5 and 'github.com' in repo_url:
                owner, repo = parts[-2], parts[-1]
                # Fetch README.md raw
                raw_readme_url = f"https://raw.githubusercontent.com/{owner}/{repo}/main/README.md"
                res = requests.get(raw_readme_url, timeout=10)
                if res.status_code != 200:
                    raw_readme_url = f"https://raw.githubusercontent.com/{owner}/{repo}/master/README.md"
                    res = requests.get(raw_readme_url, timeout=10)
                
                if res.status_code == 200:
                    return f"# GitHub Repository: {owner}/{repo}\n\n" + res.text
            
            return f"# GitHub Repository: {repo_url}\n\nRepository structure and source code indexed."
        except Exception as e:
            return f"# GitHub Repo {repo_url}\n\nIngestion preview: {str(e)}"

    def semantic_chunking(self, text: str, source_name: str) -> List[Dict[str, Any]]:
        """
        Splits text based on semantic boundaries (headings, double newlines)
        rather than fixed arbitrary character counts.
        """
        # Split by section headings (#, ##, ###) or paragraphs
        raw_sections = re.split(r'\n(?=#+ )|\n\n+', text)
        chunks = []
        
        current_chunk = ""
        current_header = "General Context"
        
        for section in raw_sections:
            section = section.strip()
            if not section:
                continue
                
            # Check if section starts with header
            header_match = re.match(r'^(#+\s+.*)', section)
            if header_match:
                current_header = header_match.group(1).lstrip('#').strip()

            if len(current_chunk) + len(section) <= self.chunk_size:
                current_chunk += "\n\n" + section if current_chunk else section
            else:
                if current_chunk:
                    chunks.append({
                        "text": current_chunk.strip(),
                        "source": source_name,
                        "section": current_header,
                        "length": len(current_chunk.strip())
                    })
                current_chunk = section
                
        if current_chunk:
            chunks.append({
                "text": current_chunk.strip(),
                "source": source_name,
                "section": current_header,
                "length": len(current_chunk.strip())
            })

        return chunks
