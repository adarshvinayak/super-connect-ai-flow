
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Search, MessageCircle, Star } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold gradient-text">SuperNetworkAI</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/auth" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                Sign In
              </Link>
              <Button asChild>
                <Link to="/auth?signup=true">Get Started</Link>
              </Button>
            </div>
            <div className="md:hidden">
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white via-supernet-lightpurple to-white py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="mt-4 text-4xl md:text-6xl font-bold gradient-text tracking-tight">
              Connect with the right people<br />using AI superpowers
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              SuperNetworkAI matches you with the perfect connections based on your unique goals, skills, and interests - whether you're looking for a cofounder, client, or teammate.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-md" asChild>
                <Link to="/auth?signup=true">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-md" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="border rounded-xl p-6 card-hover bg-white">
                <div className="h-12 w-12 rounded-lg gradient-bg flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
                <p className="text-gray-600">
                  Our algorithms analyze your profile, goals, and preferences to suggest connections that truly matter to you.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="border rounded-xl p-6 card-hover bg-white">
                <div className="h-12 w-12 rounded-lg gradient-bg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Natural Language Search</h3>
                <p className="text-gray-600">
                  Simply describe what you're looking for in plain English, and we'll find the perfect matches for you.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="border rounded-xl p-6 card-hover bg-white">
                <div className="h-12 w-12 rounded-lg gradient-bg flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">In-App Messaging</h3>
                <p className="text-gray-600">
                  Connect with your matches directly through our secure and intuitive messaging platform.
                </p>
              </div>
              
              {/* Feature 4 */}
              <div className="border rounded-xl p-6 card-hover bg-white">
                <div className="h-12 w-12 rounded-lg gradient-bg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Targeted Networking</h3>
                <p className="text-gray-600">
                  Specify exactly what you're looking for - cofounders, clients, or teammates - to streamline your networking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Target Audience Section */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Who is SuperNetworkAI for?</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm card-hover">
                <h3 className="text-xl font-semibold mb-3">Founders</h3>
                <p className="text-gray-600">
                  Find the perfect cofounder with complementary skills and aligned values to build your vision together.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm card-hover">
                <h3 className="text-xl font-semibold mb-3">Freelancers</h3>
                <p className="text-gray-600">
                  Connect with clients who need exactly what you offer, and grow your client base strategically.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm card-hover">
                <h3 className="text-xl font-semibold mb-3">Job Seekers</h3>
                <p className="text-gray-600">
                  Build relationships with companies and teams that align with your career goals and work style.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 gradient-bg">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Start building meaningful connections today
            </h2>
            <p className="text-white text-lg mb-10 opacity-90">
              Join thousands of professionals who are connecting smarter with SuperNetworkAI
            </p>
            <Button size="lg" variant="secondary" className="text-supernet-purple" asChild>
              <Link to="/auth?signup=true">
                Sign Up For Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">SuperNetworkAI</h3>
            <p className="text-gray-400">
              AI-powered professional networking platform that connects you with the right people.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/auth" className="text-gray-400 hover:text-white">Get Started</Link></li>
              <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} SuperNetworkAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
