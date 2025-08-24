# cartit_web

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### Orders (API integration only)

- Submit from cart calls `POST /order/create/` with a temporary recipient snapshot.
- On success, responses are saved to `store.order.lastOrders` and `localStorage`.
- App navigates to the placeholder page `/order/success`.
