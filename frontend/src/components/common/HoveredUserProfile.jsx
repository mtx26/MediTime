import { useState } from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, PopoverArrow } from '@/components/ui/popover';
import useIsTouchDevice from '../../hooks/device/useIsTouchDevice';
import PropTypes from 'prop-types';

export default function HoveredUserProfile({
  user,
  trigger,
  containerRef = null,
}) {
  const [open, setOpen] = useState(false);

  const isTouchDevice = useIsTouchDevice();

  // gestion mobile : click toggle
  const handleClick = () => {
    if (isTouchDevice) setOpen((prev) => !prev);
  };

  // gestion desktop : hover in/out
  const handleMouseEnter = () => {
    if (!isTouchDevice) setOpen(true);
  };
  const handleMouseLeave = () => {
    if (!isTouchDevice) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              handleClick();
            }
          }}
          onPointerEnter={handleMouseEnter}
          onPointerLeave={handleMouseLeave}
          className={`bg-transparent border-0 p-0 m-0 inline-flex items-center gap-1 text-start cursor-pointer ${
            open ? 'underline text-primary' : ''
          }`}
          aria-label="Afficher le profil de l'utilisateur"
          style={{
            font: 'inherit',
            lineHeight: 'inherit',
            transition: 'color 0.2s, text-decoration 0.2s',
          }}
        >
          <span className="flex items-center gap-1">
            {trigger}{' '}
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        sideOffset={10}
        align="center"
        className="w-62.5 p-3"
        onClick={handleClick}
        onPointerEnter={handleMouseEnter}
        onPointerLeave={handleMouseLeave}
      >
        <PopoverArrow width={12} height={6} />
        <div className="flex flex-col items-center text-center gap-2">
          <img
            src={user.photo_url}
            alt="Profil"
            className="rounded-full w-17.5 h-17.5 object-cover"
          />
          <div>
            <h6 className="mb-0 font-semibold">{user.display_name}</h6>
            <small className="text-muted-foreground">{user.email}</small>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

HoveredUserProfile.propTypes = {
  user: PropTypes.shape({
    photo_url: PropTypes.string.isRequired,
    display_name: PropTypes.string.isRequired,
    email: PropTypes.string,
  }).isRequired,
  trigger: PropTypes.node.isRequired,
  containerRef: PropTypes.object,
};
