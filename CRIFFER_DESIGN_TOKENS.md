# 🎨 Criffer — Design Tokens & Identidade Visual

Referência oficial de cores, tipografia e tokens visuais utilizados no Dashboard Comercial da Criffer.

---

## 🟠 Cor Principal

| Nome          | Hex       | Uso                                                                 |
|---------------|-----------|---------------------------------------------------------------------|
| Criffer Orange | `#FF6A22` | Cor primária da marca. Ícones de KPI, botões ativos, destaques de gráficos, alertas, elementos de foco visual, barra de progresso |

```css
--color-criffer-primary: #FF6A22;
```

> Classe Tailwind configurada: `text-criffer-primary`, `bg-criffer-primary`, `border-criffer-primary`

---

## ⬜ Cores Secundárias & Neutras

| Nome                  | Hex / Token         | Uso                                              |
|-----------------------|---------------------|--------------------------------------------------|
| Fundo do Dashboard    | `#F9FAFB` (gray-50) | Background geral da página                       |
| Cards / Containers    | `#FFFFFF`           | Superfície de cards e painéis                    |
| Texto Principal       | `#111827` (gray-900)| Títulos e valores de KPI (~90% de intensidade)   |
| Texto Secundário      | `#6B7280` (gray-500)| Labels, legendas, subtítulos                     |
| Texto Terciário       | `#9CA3AF` (gray-400)| Placeholders, datas, metadados                   |
| Bordas                | `#F3F4F6` (gray-100)| Bordas sutis de cards e separadores              |
| Fundo Ícone KPI       | `#FFF7ED` (orange-50)| Background do ícone dentro dos cards de KPI     |

```css
--color-dashboard-bg:  #F9FAFB;
--color-card-bg:       #FFFFFF;
--color-text-primary:  #111827;
--color-text-secondary:#6B7280;
--color-text-tertiary: #9CA3AF;
--color-border:        #F3F4F6;
--color-icon-bg:       #FFF7ED;
```

---

## 🟢🔴 Cores Semânticas (Variações de KPI)

| Estado     | Hex       | Classe Tailwind       | Uso                          |
|------------|-----------|-----------------------|------------------------------|
| Positivo   | `#059669` | `text-emerald-600`    | KPI subindo vs. mês anterior |
| Negativo   | `#EF4444` | `text-red-500`        | KPI caindo vs. mês anterior  |

---

## 🔤 Tipografia

### Fonte Principal

| Propriedade | Valor                      |
|-------------|----------------------------|
| Família     | **Gotham**                 |
| Alternativas| Inter → Roboto → sans-serif |
| Import      | Google Fonts (Inter como fallback web-safe) |

```css
font-family: 'Gotham', 'Inter', 'Roboto', sans-serif;
```

### Escala Tipográfica (tokens em uso)

| Token CSS / Classe     | Tamanho aprox. | Peso    | Uso                              |
|------------------------|----------------|---------|----------------------------------|
| `tv-kpi-label`         | 11–12px        | 500     | Título do card de KPI            |
| `tv-kpi-value`         | 22–28px        | 700     | Valor principal do KPI           |
| `tv-kpi-variation`     | 11–12px        | 600     | Percentual de variação (±%)      |
| `tv-section-title`     | 13–14px        | 700     | Títulos de seções/gráficos       |
| `tv-caption`           | 10–11px        | 400     | Legendas, metadados, "vs. mês ant." |

---

## 🖼️ Logo & Favicon

| Asset        | Caminho                        | Regras de uso                                           |
|--------------|--------------------------------|---------------------------------------------------------|
| Logo oficial | `/assets/Criffer-logo.webp`    | Canto superior esquerdo · altura máx. 40px · sem efeitos |
| Favicon      | `/assets/favicon.ico`          | Raiz do projeto (`/public/favicon.ico`)                 |

---

## 📐 Tokens de Layout

| Token                  | Valor           | Uso                            |
|------------------------|-----------------|--------------------------------|
| Padding lateral padrão | `px-4 sm:px-8`  | Margens horizontais das seções |
| Gap entre cards        | `gap-4 sm:gap-6`| Espaçamento entre KPI cards    |
| Altura mínima de gráfico | `min-h-[220px]`| Gráficos secundários           |
| Border-radius card     | `rounded-xl`    | Cards e containers             |
| Sombra card            | `shadow-sm`     | Elevação padrão de cards       |
| Header height          | `h-16 sm:h-20`  | Altura do cabeçalho fixo       |

---

## ✅ Checklist de Conformidade Visual

- [ ] Cor primária `#FF6A22` em elementos de destaque
- [ ] Fundo da página em cinza claro (`#F9FAFB`)
- [ ] Cards sempre com fundo branco (`#FFFFFF`)
- [ ] Fonte Gotham / Inter como fallback
- [ ] Logo no canto superior esquerdo, máx. 40px de altura
- [ ] Variações positivas em verde (`text-emerald-600`)
- [ ] Variações negativas em vermelho (`text-red-500`)
- [ ] Sem cores puras (evitar red/blue/green puros — usar paleta curada)
