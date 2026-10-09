# LiftFuel

A workout planning and nutrition tracking web app built for WDD 330 at BYU-Pathway.

## Live Site

[https://josuequinones19.github.io/liftfuel/](https://josuequinones19.github.io/liftfuel/)

## Features

- **Dashboard** with weekly workout count, calorie/protein tracking, streak counter, and recent activity
- **Exercise Search** powered by the wger REST API with category and muscle group filters
- **Exercise Detail View** with description, muscles targeted, equipment, and images
- **Nutrition Tracking** placeholder (Week 6, USDA FoodData Central API)
- **Workout Builder** placeholder (Week 6-7)
- Responsive design with mobile hamburger navigation and desktop nav
- localStorage-based data persistence

## Technologies

- Vanilla HTML, CSS, and JavaScript (no frameworks)
- [wger REST API](https://wger.de/api/v2/) for exercise data
- [USDA FoodData Central API](https://fdc.nal.usda.gov/api-guide) for nutrition data (Week 6)
- GitHub Pages for deployment

## Project Structure

```
liftfuel/
├── css/
│   └── styles.css
├── js/
│   ├── api/
│   │   ├── wger.js        # wger API integration
│   │   └── usda.js        # USDA API placeholder
│   ├── dashboard.js       # Dashboard page logic
│   ├── exercises.js       # Exercise search page logic
│   ├── storage.js         # localStorage wrapper
│   ├── ui.js              # Shared UI (nav, modals, cards)
│   └── utils.js           # Helper utilities
├── index.html             # Dashboard
├── exercises.html         # Exercise search
├── workouts.html          # Workouts (placeholder)
└── nutrition.html         # Nutrition (placeholder)
```

## Trello Board

[https://trello.com/b/v8FDimKg](https://trello.com/b/v8FDimKg)

## Author

Josue Quinones Sigala
