import { Curriculum } from './types';

/**
 * The Master Curriculum: Comprehensive Indian educational content structure.
 * This object defines academic subjects and competitive exam preparation content.
 */
export const MasterCurriculum: Curriculum = {
  neet_preparation: {
    displayName: 'NEET Medical Entrance',
    structure: [
      {
        key: 'neet_physics',
        displayName: 'NEET Physics',
        subCategories: [
          { key: 'mechanics_applications', displayName: 'Mechanics Problem Solving' },
          { key: 'electricity_medical', displayName: 'Electricity in Medical Devices' },
          { key: 'optics_human_eye', displayName: 'Optics & Human Eye' },
          { key: 'modern_physics_medical', displayName: 'Modern Physics in Medicine' },
        ],
      },
      {
        key: 'neet_chemistry',
        displayName: 'NEET Chemistry',
        subCategories: [
          { key: 'organic_reactions', displayName: 'Organic Reaction Mechanisms' },
          { key: 'biomolecule_chemistry', displayName: 'Chemistry of Biomolecules' },
          { key: 'coordination_compounds', displayName: 'Coordination Chemistry' },
          { key: 'environmental_chemistry', displayName: 'Environmental Chemistry' },
        ],
      },
      {
        key: 'neet_biology',
        displayName: 'NEET Biology',
        subCategories: [
          { key: 'human_physiology_detailed', displayName: 'Human Physiology Deep Dive' },
          { key: 'genetics_molecular', displayName: 'Genetics & Molecular Biology' },
          { key: 'ecology_environment', displayName: 'Ecology & Environmental Issues' },
          { key: 'plant_physiology', displayName: 'Plant Physiology & Anatomy' },
        ],
      },
    ],
  },
};