import Navbar from "../component/Navbar.tsx";
import { useTranslation } from 'react-i18next';

function AboutUsPage() {
    const { t } = useTranslation('about');

    return(
        <div className="min-h-screen bg-[#FFEDDD]">
            <Navbar />
            <div className="mt-10 max-w-7xl m-auto w-[60%]">
                {/* Title */}
                <h1 className="text-5xl font-bold text-center mb-12">
                    {t('title')}
                </h1>

                {/* Overview Section */}
                <div className="flex flex-col md:flex-row items-center gap-10">
                    {/* Left: Text */}
                    <div className="md:w-1/2">
                        <h2 className="text-2xl font-semibold mb-4">
                            {t('overview.title')}
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            {t('overview.paragraph1')}
                        </p>

                        <p className="text-gray-600 leading-relaxed mt-4">
                            {t('overview.paragraph2')}
                        </p>
                    </div>

                    {/* Right: Image */}
                    <div className="md:w-1/2">
                    <img
                        src="/overview.png"
                        alt="Overview"
                        className="w-full h-auto rounded-xl shadow-md"
                    />
                    </div>
                </div>

                {/* Our Team Section */}
                <div className="mt-16 pb-16">
                    <h2 className="text-2xl font-semibold mb-8">
                        {t('team.title')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        {/* Member 1 */}
                        <div className="text-center">
                        <img
                            src="/team1.png"
                            alt="Team Member 1"
                            className="w-40 h-40 mx-auto object-cover rounded-full shadow-md"
                        />
                        <p className="mt-4 font-medium">
                            {t('team.members.member1')}
                        </p>
                        </div>

                        {/* Member 2 */}
                        <div className="text-center">
                        <img
                            src="/team2.png"
                            alt="Team Member 2"
                            className="w-40 h-40 mx-auto object-cover rounded-full shadow-md"
                        />
                        <p className="mt-4 font-medium">
                            {t('team.members.member2')}
                        </p>
                        </div>

                        {/* Member 3 */}
                        <div className="text-center">
                        <img
                            src="/team3.png"
                            alt="Team Member 3"
                            className="w-40 h-40 mx-auto object-cover rounded-full shadow-md"
                        />
                        <p className="mt-4 font-medium">
                            {t('team.members.member3')}
                        </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default AboutUsPage;