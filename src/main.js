import Vue from 'vue';
import VueRouter from 'vue-router';
import VueAxios from 'vue-axios';
import axios from 'axios';
import App from './App.vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/stylesheets/neon-glow.css'
import './assets/stylesheets/styles.css'

import HomeComponent from './components/HomeComponent.vue';

Vue.use(VueRouter);
Vue.use(VueAxios, axios);
Vue.config.productionTip = false;

const routes = [
  {
    name: 'home',
    path: '/',
    component: HomeComponent,
  },
];

const router = new VueRouter({ mode: 'history', routes });
new Vue(Vue.util.extend({ router }, App)).$mount('#app');
