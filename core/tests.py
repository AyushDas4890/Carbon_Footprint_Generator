import tempfile
from pathlib import Path
from unittest import mock

from django.test import TestCase
from django.urls import resolve, reverse

from advisor.models import IngestedDocument
from core import views

PAGE_ROUTES = ['home', 'results', 'insights', 'compare_page', 'decompose_page', 'advisor']


class SpaViewTests(TestCase):
    def test_every_page_route_serves_the_spa(self):
        for name in PAGE_ROUTES:
            self.assertIs(resolve(reverse(name)).func, views.spa_view, name)

    def test_returns_built_index_html(self):
        with tempfile.TemporaryDirectory() as tmp:
            index = Path(tmp) / 'index.html'
            index.write_text('<div id="root"></div>', encoding='utf-8')
            with mock.patch.object(views, 'SPA_INDEX', index):
                res = self.client.get(reverse('compare_page'), secure=True)
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, '<div id="root"></div>')

    def test_missing_build_is_a_clear_503(self):
        with mock.patch.object(views, 'SPA_INDEX', Path('/nonexistent/index.html')):
            res = self.client.get(reverse('home'), secure=True)
        self.assertEqual(res.status_code, 503)
        self.assertIn(b'Frontend not built', res.content)


class KnowledgeBaseApiTests(TestCase):
    def test_reports_indexed_documents(self):
        IngestedDocument.objects.create(source_name='ipcc_ar6.pdf')
        res = self.client.get(reverse('advisor_kb'), secure=True)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['doc_count'], 1)
        self.assertEqual(res.json()['docs'], ['ipcc_ar6.pdf'])
