export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="absolute bottom-0 left-0 right-0 py-6 text-center z-10">
      <p className="text-foreground/40 text-sm font-body">
        © {currentYear} Vetra. All rights reserved.
      </p>
    </footer>
  );
}
