export function Footer() {
  const currentYear = new Date().getFullYear();

  const servicesLinks = [
    { label: "Domestic courier", href: "#" },
    { label: "eCommerce courier", href: "#" },
    { label: "eBay courier", href: "#" },
  ];

  const resourcesLinks = [
    { label: "Freight profile specifications", href: "#" },
    { label: "Delivery choices", href: "#" },
    { label: "Coupon calculator", href: "#" },
    { label: "Fuel surcharge", href: "#" },
    { label: "Depot locations", href: "#" },
    { label: "Media releases", href: "#" },
    { label: "Location master", href: "#" },
    { label: "Parcel protect claim form", href: "#" },
  ];

  const termsLinks = [
    { label: "Terms of Carriage", href: "#" },
    { label: "Parcel protect", href: "#" },
    { label: "Cover for goods in transit", href: "#" },
    { label: "Franchise related payments", href: "#" },
    { label: "Franchise Income Guarantee", href: "#" },
    { label: "Dangerous Goods", href: "#" },
  ];

  const policiesLinks = [
    { label: "Privacy policy", href: "#" },
    { label: "Modern Slavery Statement", href: "#" },
    { label: "Work Health & Safety", href: "#" },
    { label: "Scam protection", href: "#" },
  ];

  return (
    <footer
      className="text-white font-sans bg-[var(--color-footer-bg)]"
      style={{ backgroundColor: "#363b40" }}
    >
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Branding & Copyright */}
          <div className="lg:col-span-1 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  CouriersPlease
                </h2>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-white">FCA</p>
                <p className="text-sm text-gray-400">Franchise Council of Australia</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Copyright ©{currentYear} by CouriersPlease
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Services</h3>
            <ul className="space-y-2.5">
              {servicesLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Resources</h3>
            <ul className="space-y-2.5">
              {resourcesLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Terms & Conditions</h3>
            <ul className="space-y-2.5">
              {termsLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies & Security */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Policies & Security</h3>
            <ul className="space-y-2.5">
              {policiesLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
