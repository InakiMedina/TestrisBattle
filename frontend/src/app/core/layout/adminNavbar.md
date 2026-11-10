# Admin navbar plan

## Goal and scope

Use the existing navbar component for both player and admin users. Do not create
separate player/admin navbar components or split the navbar into modules as part
of this plan. The first visible change is to show **Admin Tetris** instead of
**Tetris** in the navbar brand for an admin; players continue to see **Tetris**.

The navbar currently lives in `core/layout/navbar/`. Use `AuthService` as the
source of the logged-in user's role. The interceptor at
`core/auth/auth.interceptor.ts` is a reference for how the app obtains the
token from `AuthService`; the navbar should use the service's user/role state,
not decode the token itself.

## Role source

`AuthService` already exposes `currentUser`, `role`, and `hasRole()`. Its
`restoreSession()` method loads the user from `/auth/me` before the first
application render. The navbar should use this service state so the title stays
in sync with login, logout, and session restoration. Do not independently
decode the JWT in the navbar.

The backend remains responsible for authorization. Hiding or changing navbar
content based on a client-side role is presentation only, not access control.

## Role-dependent HTML options

The title can be made role-dependent in several ways:

- **Angular template conditional (`@if`):** render one of two brand labels
  based on `AuthService.role()`. This makes the role-specific markup explicit
  and is a good fit if the two titles later need different markup.
- **Template interpolation from a component value:** derive one brand label
  from the service role in the component and bind it in the template. This
  keeps the HTML simple and is a good fit when only the text differs.
- **CSS class or attribute:** bind a class/attribute based on the role and use
  CSS for visual differences. CSS does not change the actual accessible text,
  so it should not be used to switch between “Tetris” and “Admin Tetris”.
- **Direct JavaScript/DOM updates:** manually change the element's text from
  component code. Avoid this: it bypasses Angular's template bindings and
  makes updates and tests harder to reason about.

**Chosen and implemented:** use `AuthService` with template interpolation from
a component value. Keep the brand's existing styling unchanged.

## Implementation status

- [x] Use `AuthService` role state in the existing navbar component. The
  component derives the brand title and binds it with template interpolation:
  admins see **Admin Tetris**; players and users without a loaded role see
  **Tetris**. The accessible label uses the same value.
- [x] Keep the navbar component, pages, routes, and styling unchanged.
- [x] Add navbar coverage for admin and player labels; the default null role
  remains **Tetris**.
- [ ] Manually verify the label after logout and session expiry.

## Future flexibility (context only; not part of this plan)

The navbar's visual style is expected to remain shared, but its pages/links
could differ substantially between player and admin. A future design could
represent links as data (for example, arrays of navigation items with labels,
routes, and icons) and select the appropriate set using the role. That would
allow page lists to change without tying the whole navbar structure to a
title-only conditional. This is only an architectural consideration; it is not part of this plan and
does not call for implementing role-specific pages or navigation now.

## Not included

- Creating separate player and admin navbar components.
- Splitting the navbar into modules or separate implementations.
- Changing the navbar pages or links.
