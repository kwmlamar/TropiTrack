import { Building2, Star, Users } from "lucide-react"

export function TrustedBySection() {
  return (
    <section className="py-16 bg-gradient-to-r from-yellow-50 to-cyan-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Built for Bahamian Contractors
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Designed specifically for construction companies in the Bahamas, with local expertise and compliance built-in
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="mb-4">
              <Building2 className="h-12 w-12 text-yellow-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Local Expertise
            </h3>
            <p className="text-gray-600">
              Built by Bahamians, for Bahamian construction companies
            </p>
          </div>

          <div className="text-center">
            <div className="mb-4">
              <Users className="h-12 w-12 text-cyan-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Growing Community
            </h3>
            <p className="text-gray-600">
              Join construction professionals already using TropiTrack
            </p>
          </div>

          <div className="text-center">
            <div className="mb-4">
              <Star className="h-12 w-12 text-yellow-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Bahamas Compliant
            </h3>
            <p className="text-gray-600">
              NIB calculations and local regulations built-in
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-sm">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <span className="text-gray-700 font-medium">
              &quot;Designed specifically for construction companies in the Bahamas&quot;
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
