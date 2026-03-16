export interface HRNews {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  timeAgo: string;
  imageUrl: string;
}

export const mockHRNews: HRNews[] = [
  {
    id: '1',
    category: 'Empresa',
    categoryColor: 'text-primary',
    title: 'Nuevos beneficios de salud para el 2024',
    timeAgo: 'Hace 2 horas',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcGIVk3HrCZL5Eeb2Q7Oi9GV8cVjgPDo05uVaOmZJMDR33QLFf47TVk-k21MUbJYZ786Y5wm-pewqYP-zdit7ISa0f9SFkg1lPN9xMYTIj6wHG-H789ahFGQaNZFrIBE9JrXVYyQObFgxqEpzBiHSwbUJ0hrzCVHgklyPjUwmbujfL4Q2he4uE4k4GPxHdVZJRtu0cKlKM3HVrRjuJf5fegypd7Gg4qg-bIxqTRTrfk7zWEjqaOIlI1avEqhwDcsz_FUsR28YjGDM'
  },
  {
    id: '2',
    category: 'Capacitación',
    categoryColor: 'text-green-600',
    title: 'Taller de Liderazgo Consciente: Inscripciones abiertas',
    timeAgo: 'Ayer',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrw0NFGZ0GgT2GIJaq7-yPWghBAHJRhq_AiHqpjnj85VAAHiZSkzfw0rnGc2aaLLeHZ-IzhwOEfMtBJ0tq_z0MYcz9w7aeVJKqlj3aYk4Hq-9ZHueGv_nwJxs4R1c2MQQqC9zEVegVnV4cdWZmUF6zEpXL4Zd-wxZoapEd_Axjsql6b_r8NvZ2pXSZEWPw18VkjipG0G4Z3hkoTDyJHU74xi1A027BxnCgK0wAGYvUBKrTA19OKdTVCnVzfch6hNsW8U_xEjzMxWg'
  }
];

export const employeeProfile = {
  name: 'Carlos',
  fullName: 'Carlos Rodríguez',
  availableVacationDays: 15,
  lastPayslip: 'Octubre 2023',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5J9wUot4w-sYhAk2yYS8E3mV1UYiorxJWWg20Y8X1My1_WyxbMRMkF7zuO-nat50lB7q5EhKVv0pmuPTgNA1DLG-xvX61LnkeGtZ07WVE53hljBEEheABHkfvhPafEmncbs6GRCcZaWTsqsj8UfNDjSgaKvhrq1Gn6tX9iO6hQ-HKBaQr3Y4o5QW5xmAgSw3XPkG1ed4E85trfKP5VPfSUpTdARgzSmUXBO3vc8MvAWqmqfAhK6PuxUNi9jqBeqtNF0XvHg64y-c'
};