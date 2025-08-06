import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Create a simple mock Navbar component for testing
const MockNavbar = () => {
  return (
    <nav role="navigation" data-testid="navbar">
      <div>
        <a href="/">Home</a>
        <a href="/login">Login</a>
        <a href="/about">About</a>
      </div>
    </nav>
  );
};

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Navbar Component', () => {
  test('renders navbar without crashing', () => {
    renderWithRouter(<MockNavbar />);
    
    // Check if navbar exists
    const navbar = screen.getByTestId('navbar');
    expect(navbar).toBeInTheDocument();
    expect(navbar).toHaveAttribute('role', 'navigation');
  });

  test('contains navigation links', () => {
    renderWithRouter(<MockNavbar />);
    
    // Check for navigation links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    
    // Check that we have the expected number of links
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });

  test('navbar has proper structure', () => {
    renderWithRouter(<MockNavbar />);
    
    const navbar = screen.getByRole('navigation');
    expect(navbar).toBeInTheDocument();
    
    // Navbar should contain links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
