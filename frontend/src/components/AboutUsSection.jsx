import React from 'react';
import { useTranslation } from 'react-i18next';

const AboutUsSection = ({ team }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 sm:px-8 lg:px-16">
      <div id="aboutus" className="mt-24 mb-16 text-center">
        {/* Translate heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
          {t('about.title')}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
          {team.map((member) => (
            <a
              key={member.name}
              href={member.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/40 hover:bg-white/70 transition-all transform hover:scale-105 shadow-lg block"
              style={{ textDecoration: 'none' }}
            >
              <img
                src={member.photo}
                alt={member.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-6 border-4 border-blue-200 shadow"
              />
              <h3 className="text-xl font-semibold text-blue-900 mb-2">{member.name}</h3>
              {/* Translate role and description */}
              <p className="text-blue-800 mb-1">{t(`team.${member.key}.role`)}</p>
              <p className="text-blue-700 text-sm">{t(`team.${member.key}.desc`)}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUsSection;
