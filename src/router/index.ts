import { createRouter, createWebHistory } from 'vue-router'
import AppShellLayout from '../layouts/AppShellLayout.vue'
import AssessmentsUploadPage from '../pages/AssessmentsUploadPage.vue'
import AssessmentsEvaluatePage from '../pages/AssessmentsEvaluatePage.vue'
import DummyPage from '../pages/DummyPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppShellLayout,
      children: [
        { path: '', redirect: '/assessments/upload' },
        { path: 'dashboard', component: DummyPage, props: { title: 'Dashboard' } },
        { path: 'settings', component: DummyPage, props: { title: 'Settings' } },
        { path: 'assessments/upload', component: AssessmentsUploadPage },
        { path: 'assessments/evaluate', component: AssessmentsEvaluatePage },
      ],
    },
  ],
})

export default router
