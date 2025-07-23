import React from 'react';
import { useTranslation } from 'react-i18next';

const ServicesSection = ({ features }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 sm:px-8 lg:px-16">
      <div id="services" className="mt-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            {t('services.title')}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/40 hover:bg-white/70 transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                {t(`features.feature${index + 1}_title`)}
              </h3>
              <p className="text-blue-800 leading-relaxed">
                {t(`features.feature${index + 1}_desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicesSection;
