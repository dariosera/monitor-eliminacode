import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Segretaria from '../views/Segretaria.vue'
import Medico from '../views/Medico.vue';
import Monitor from '../views/Monitor.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Medico',
      component: Medico
    },
    {
      path: '/segretaria',
      name: 'Segretaria',
      component: Segretaria
    },
    {
      path: '/monitor',
      name: 'Monitor',
      component: Monitor
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

export default router
