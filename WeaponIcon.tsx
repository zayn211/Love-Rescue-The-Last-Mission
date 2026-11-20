import React from 'react';
import {
  Bomb,
  Crosshair,
  Flame,
  RefreshCw,
  Shield,
  Snowflake,
  Sword,
  Zap,
  Cpu,
} from 'lucide-react';
import { WeaponId } from '../types/game';

interface WeaponIconProps {
  weaponId: WeaponId;
  className?: string;
}

export const WeaponIcon: React.FC<WeaponIconProps> = ({
  weaponId,
  className = 'w-5 h-5',
}) => {
  switch (weaponId) {
    case 'sword_slash':
      return <Sword className={className} />;
    case 'fireball':
      return <Flame className={className} />;
    case 'boomerang':
      return <RefreshCw className={className} />;
    case 'magic_bow':
      return <Crosshair className={className} />;
    case 'thunder_attack':
      return <Zap className={className} />;
    case 'ice_blaster':
      return <Snowflake className={className} />;
    case 'energy_gun':
      return <Cpu className={className} />;
    case 'explosive_bomb':
      return <Bomb className={className} />;
    case 'shield_aura':
      return <Shield className={className} />;
    case 'speed_surge':
      return <Zap className={className} />;
  }
};
