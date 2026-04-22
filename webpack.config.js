const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'contact-management-mfe',

  exposes: {
    './ContactApp': 
      './src/app/app.ts',
    './ContactDashboardComponent':
      './src/app/contact-dashboard-component/contact-dashboard-component.ts',
    './ContactStaffComponent': 
      './src/app/contact-staff-component/contact-staff-component.ts',
    './ContactStaffAddComponent': 
      './src/app/contact-staff-component/contact-staff-add-component/contact-staff-add-component.ts',
    './ContactStaffEditComponent': 
      './src/app/contact-staff-component/contact-staff-edit-component/contact-staff-edit-component.ts',
    './ContactStaffSecurityComponent': 
      './src/app/contact-staff-component/contact-staff-security-component/contact-staff-security-component.ts',
    './ContactClientComponent': 
      './src/app/contact-client-component/contact-client-component.ts',
    './ContactClientAddComponent': 
      './src/app/contact-client-component/contact-client-add-component/contact-client-add-component.ts',
    './ContactClientEditComponent': 
      './src/app/contact-client-component/contact-client-edit-component/contact-client-edit-component.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
