import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/index.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/register/index.vue'),
    },
    {
      path: '/',
      component: () => import('@/components/MainLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/pages/dashboard/index.vue'),
        },
        {
          path: 'positions',
          name: 'positions',
          component: () => import('@/pages/positions/index.vue'),
        },
        {
          path: 'candidates',
          name: 'candidates',
          component: () => import('@/pages/candidates/index.vue'),
        },
        {
          path: 'candidates/add',
          name: 'candidates-add',
          component: () => import('@/pages/candidates/add.vue'),
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/pages/employees/index.vue'),
        },
        {
          path: 'hr-management',
          name: 'hr-management',
          component: () => import('@/pages/hr-management/index.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/settings/index.vue'),
        },
      ],
    },
  ],
})

export default router
