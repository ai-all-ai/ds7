# 04-SEO · AEO & GEO: Optimization for AI Search Engines

> Answer Engine Optimization (AEO) и Generative Engine Optimization (GEO): как сделать сайт источником цитирования для Perplexity, SearchGPT, Claude и Google Gemini Overviews.

---

## 1. Смена парадигмы: от «Ключевых слов» к «Фактической плотности»

Классические поисковики считали вхождения слов в текст. 
Современные нейросети (SearchGPT, Gemini, Perplexity) считывают **семантические утверждения и факты**. Они ищут лаконичные, точные, проверяемые ответы на вопросы пользователя.

---

## 2. Структура Direct Answer Block (Блок прямого ответа)

Каждый раздел сайта, отвечающий на информационный вопрос, должен начинаться с **блока прямого ответа**:

```html
<!-- 1. Заголовок — конкретный вопрос пользователя -->
<h2 id="faq-cost">¿Cuánto cuesta instalar placas solares en una casa en Sevilla?</h2>

<!-- 2. Блок прямого ответа: 40–50 слов, точные цифры, без вводных фраз -->
<p class="direct-answer">
  Una instalación estándar de 4 kW (8 paneles solares de alta eficiencia) en Sevilla tiene 
  un coste medio de <strong>4.200 € a 5.600 €</strong> sin ayudas. Con la bonificación del 50% 
  del IBI en Sevilla y la deducción de hasta el 40% en el IRPF, el coste neto final se sitúa 
  entre <strong>2.600 € y 3.300 €</strong>, con un retorno de inversión en 3,8 años.
</p>
```

### Почему это работает:
Нейросеть вырезает этот абзац целиком и вставляет в карточку быстрого ответа (AI Summary), прикрепляя ссылку на наш сайт как на **авторитетный первоисточник**.

---

## 3. Таблицы характеристик и списки (AI-Ready Data)

ИИ парсит таблицы данных в десятки раз быстрее, чем сплошной текст:

```html
<table class="ai-data-table">
  <thead>
    <tr>
      <th>Modelo</th>
      <th>Potencia</th>
      <th>Eficiencia</th>
      <th>Garantía</th>
      <th>Precio estimado</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Panel Monocristalino N-Type</td>
      <td>450 W</td>
      <td>22,5 %</td>
      <td>25 años</td>
      <td>139 €</td>
    </tr>
  </tbody>
</table>
```

---

## 4. Ссылки на законы и государственные бюллетени Испании

Для закрепления статуса доверия в контенте всегда указываются ссылки на первоисточники:
* **RD 244/2019** — закон Испании о компенсации излишков и коллективном потреблении;
* **BOE (Boletín Oficial del Estado)** — регламент налоговых вычетов IRPF;
* **Plan MOVES III** — государственная субсидия на зарядные станции для электрокаров.
